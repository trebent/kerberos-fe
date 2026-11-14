import { Component, effect, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import { User, UsersService } from '../../../../services/admin';
import { IdSelection } from '../../../../utils/id-selection';
import { requestStatus } from '../../../../utils/request-status';

@Component({
  imports: [
    RequestFeedback,
    EditPanel,
    MatButton,
    MatCheckbox,
    MatFormField,
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

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly selectedGroups = new IdSelection();
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

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

  /** Saves the username, then the group membership. */
  protected save(): void {
    if (this.editForm.invalid) return;
    const userId = this.user().id;
    const groupIDs = [...this.selectedGroups.selected()];
    const request$ = this.usersService
      .updateUser(userId, this.editForm.getRawValue())
      .pipe(switchMap(() => this.usersService.updateUserGroups(userId, { groupIDs })));
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
