import { Component, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { User, UsersService } from '../../../../services/admin';
import { toggleId } from '../../../../utils/selection';

@Component({
  host: { class: 'section-card edit-panel' },
  imports: [
    ErrorDisplay,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  selector: 'app-user-edit',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly closed = output<void>();

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
      this.selectedGroupIds.set((u.groups ?? []).map((g) => g.id));
    });
  }

  isSelected(groupId: number): boolean {
    return this.selectedGroupIds().includes(groupId);
  }

  toggleGroup(groupId: number): void {
    this.selectedGroupIds.update((ids) => toggleId(ids, groupId));
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { username } = this.editForm.getRawValue();
    const userId = this.user().id;
    this.usersService
      .updateUser(userId, { username })
      .pipe(
        switchMap(() =>
          this.usersService.updateUserGroups(userId, { groupIDs: this.selectedGroupIds() }),
        ),
      )
      .subscribe({
        next: () => this.saved.emit(),
        error: () => this.saveErrors.set(['Failed to save. Please try again.']),
      });
  }

  close(): void {
    this.closed.emit();
  }
}
