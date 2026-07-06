import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../../api/admin/api/users.service';
import { User } from '../../../../api/admin/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { UserDetailComponent } from '../user-detail/user-detail.component';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
    UserDetailComponent,
  ],
})
export class UsersListComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'username', 'groups', 'actions'];

  readonly usersResource = rxResource({
    stream: () => this.usersService.getUsers(),
  });

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly selectedUser = signal<User | null>(null);

  readonly groupName = (g: { name: string }) => g.name;

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.selectedUser.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { username, password } = this.createForm.getRawValue();
    this.usersService.createUser({ username, password }).subscribe({
      next: () => {
        this.showCreate.set(false);
        this.createForm.reset();
        this.usersResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create user. Please try again.']);
      },
    });
  }

  openEdit(user: User): void {
    this.showCreate.set(false);
    this.selectedUser.set(user);
  }

  onDetailSaved(): void {
    this.selectedUser.set(null);
    this.usersResource.reload();
  }

  onDetailCancelled(): void {
    this.selectedUser.set(null);
  }

  deleteUser(userId: number): void {
    if (this.selectedUser()?.id === userId) {
      this.selectedUser.set(null);
    }
    this.usersService.deleteUser(userId).subscribe({
      next: () => this.usersResource.reload(),
    });
  }
}
