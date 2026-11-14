import { Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditDialog } from '../../../../components/edit-dialog/edit-dialog';
import { RequestFeedback } from '../../../../components/request-feedback/request-feedback';
import {
  CreateOrganisation201Response,
  OrganisationsService,
} from '../../../../services/auth-basic';
import { requestStatus } from '../../../../utils/request-status';

/**
 * Creates an organisation, then shows its admin credentials, which Kerberos returns only once.
 * It stays open until the user confirms they saved them, and closes with the new organisation's
 * ID. Opened with `disableClose`, so a stray click outside cannot lose the credentials.
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

  protected readonly form = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: async () => this.create() },
  });

  protected readonly credentials = signal<CreateOrganisation201Response | null>(null);

  private create(): void {
    this.createStatus.run(this.orgsService.createOrganisation(this.form().value()), (created) =>
      this.credentials.set(created),
    );
  }

  protected close(): void {
    this.dialogRef.close(this.credentials()?.id);
  }
}
