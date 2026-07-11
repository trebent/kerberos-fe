import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { UsersService } from '../../../../api/auth-basic/api/users.service';
import { User } from '../../../../api/auth-basic/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrgUserDetailComponent } from '../org-user-detail/org-user-detail.component';

@Component({
  selector: 'app-org-users-list',
  templateUrl: './org-users-list.component.html',
  styleUrl: './org-users-list.component.scss',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ErrorDisplayComponent,
    OrgUserDetailComponent,
  ],
})
export class OrgUsersListComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  readonly usersResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<User[]>([]);
      }
      return this.usersService.listUsers(orgId);
    },
  });

  readonly dataSource = new MatTableDataSource<User>();

  constructor() {
    effect(() => {
      this.dataSource.data = this.usersResource.value() ?? [];
    });
  }

  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly selectedUser = signal<User | null>(null, { equal: () => false });

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.orgId() === null) return;
    this.createErrors.set([]);
    const { name, password } = this.createForm.getRawValue();
    this.usersService.createUser(this.orgId()!, { name, password }).subscribe({
      next: () => {
        this.createForm.reset();
        this.usersResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create user. Please try again.']);
      },
    });
  }

  openEdit(user: User): void {
    this.selectedUser.set(user);
  }

  onDataChanged(): void {
    this.usersResource.reload();
  }

  onDetailClosed(): void {
    this.selectedUser.set(null);
  }

  deleteUser(userId: number): void {
    if (this.orgId() === null) return;
    if (this.selectedUser()?.id === userId) {
      this.selectedUser.set(null);
    }
    this.usersService.deleteUser(this.orgId()!, userId).subscribe({
      next: () => this.usersResource.reload(),
    });
  }
}
