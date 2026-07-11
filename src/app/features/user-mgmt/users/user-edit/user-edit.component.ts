import { Component, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';
import { UsersService } from '../../../../api/admin/api/users.service';
import { User } from '../../../../api/admin/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
  ],
})
export class UserEditComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  readonly selectedGroupIds = signal<number[]>([]);
  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const u = this.user();
      this.editForm.reset({ username: u.username });
      this.selectedGroupIds.set((u.groups ?? []).map(g => g.id));
    });
  }

  isSelected(groupId: number): boolean {
    return this.selectedGroupIds().includes(groupId);
  }

  toggleGroup(groupId: number): void {
    const current = this.selectedGroupIds();
    if (current.includes(groupId)) {
      this.selectedGroupIds.set(current.filter(id => id !== groupId));
    } else {
      this.selectedGroupIds.set([...current, groupId]);
    }
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { username } = this.editForm.getRawValue();
    const userId = this.user().id;
    this.usersService.updateUser(userId, { username }).pipe(
      switchMap(() => this.usersService.updateUserGroups(userId, { groupIDs: this.selectedGroupIds() })),
    ).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
