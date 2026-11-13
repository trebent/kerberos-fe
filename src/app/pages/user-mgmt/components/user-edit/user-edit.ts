import { Component, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { User, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    ReactiveFormsModule,
  ],
  selector: 'app-user-edit',
  styleUrl: './user-edit.scss',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly selectedGroups = new IdSelection();
  protected readonly saveErrors = signal<string[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const u = this.user();
      this.editForm.reset({ username: u.username });
      this.selectedGroups.set((u.groups ?? []).map((g) => g.id));
    });
  }

  protected save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { username } = this.editForm.getRawValue();
    const userId = this.user().id;
    this.usersService
      .updateUser(userId, { username })
      .pipe(
        switchMap(() =>
          this.usersService.updateUserGroups(userId, {
            groupIDs: [...this.selectedGroups.selected()],
          }),
        ),
      )
      .subscribe({
        next: () => this.saved.emit(),
        error: () => this.saveErrors.set(['Failed to save. Please try again.']),
      });
  }
}
