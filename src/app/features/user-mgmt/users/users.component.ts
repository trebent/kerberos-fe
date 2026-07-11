import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../api/admin/api/users.service';
import { User } from '../../../api/admin/model/user';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';
import { UserEditComponent } from './user-edit/user-edit.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatDividerModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
    UserEditComponent,
  ],
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['id', 'username', 'groups', 'actions'];

  readonly usersResource = rxResource({
    stream: () => this.usersService.getUsers(),
  });

  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly selectedUser = signal<User | null>(null, { equal: () => false });

  readonly groupName = (g: { name: string }) => g.name;

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.selectedUser.set(null);
  }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.createErrors.set([]);
    const { username, password } = this.createForm.getRawValue();
    this.usersService.createUser({ username, password }).subscribe({
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
