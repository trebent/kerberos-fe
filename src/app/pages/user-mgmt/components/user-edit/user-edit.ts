import { Component, effect, inject, input, linkedSignal, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
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
    EditPanel,
    FormField,
    FormRoot,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    RequestFeedback,
  ],
  selector: 'app-user-edit',
  templateUrl: './user-edit.html',
})
export class UserEdit {
  private readonly usersService = inject(UsersService);

  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  protected readonly selectedGroups = new IdSelection();
  protected readonly saveStatus = requestStatus({ failure: 'Failed to save. Please try again.' });

  protected readonly editForm = form(
    linkedSignal(() => ({ username: this.user().username })),
    (path) => required(path.username),
    { submission: { action: async () => this.save() } },
  );

  constructor() {
    effect(() => this.selectedGroups.set((this.user().groups ?? []).map((g) => g.id)));
  }

  /** Saves the username, then the group membership. */
  private save(): void {
    const userId = this.user().id;
    const groupIDs = [...this.selectedGroups.selected()];
    const request$ = this.usersService
      .updateUser(userId, this.editForm().value())
      .pipe(switchMap(() => this.usersService.updateUserGroups(userId, { groupIDs })));
    this.saveStatus.run(request$, () => this.saved.emit());
  }
}
