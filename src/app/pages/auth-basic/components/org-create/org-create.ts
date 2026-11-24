import { Component, effect, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import {
  CreateOrganisation201Response,
  CreateOrganisationRequest,
  OrganisationsService,
} from '../../../../services/auth-basic';
import { requestStatus } from '../../../../utils/request-status';

/**
 * Creates an organisation, then shows its admin credentials, which Kerberos returns only once.
 * It stays open until the user confirms they saved them, and closes with the new organisation's
 * ID. Before that it closes like any other dialog, on Escape or a click outside.
 */
@Component({
  imports: [
    EditDialog,
    FormField,
    FormRoot,
    MatButton,
    MatDialogClose,
    MatFormField,
    MatInput,
    MatLabel,
    RequestFeedback,
  ],
  selector: 'app-org-create',
  styleUrl: './org-create.scss',
  templateUrl: './org-create.html',
})
export class OrgCreate {
  private readonly orgsService = inject(OrganisationsService);
  private readonly dialogRef = inject<MatDialogRef<OrgCreate, number>>(MatDialogRef);

  protected readonly createStatus = requestStatus({
    failure: 'Failed to create organisation. Please try again.',
  });

  protected readonly form = form(
    signal<CreateOrganisationRequest>({ name: '' }),
    (path) => required(path.name),
    { submission: { action: async () => this.create() } },
  );

  protected readonly credentials = signal<CreateOrganisation201Response | null>(null);

  constructor() {
    // Once a create is under way, closing would lose credentials Kerberos shows only once.
    effect(() => {
      this.dialogRef.disableClose = this.createStatus.pending() || this.credentials() !== null;
    });
  }

  private create(): void {
    this.createStatus.run(this.orgsService.createOrganisation(this.form().value()), (created) =>
      this.credentials.set(created),
    );
  }

  protected close(): void {
    this.dialogRef.close(this.credentials()?.id);
  }
}
