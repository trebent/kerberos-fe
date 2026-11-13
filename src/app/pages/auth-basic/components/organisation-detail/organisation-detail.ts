import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { EditPanel } from '../../../../components/edit-panel/edit-panel';
import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Organisation, OrganisationsService } from '../../../../services/auth-basic';

@Component({
  imports: [
    EditPanel,
    ErrorDisplay,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
  ],
  selector: 'app-organisation-detail',
  styleUrl: './organisation-detail.scss',
  templateUrl: './organisation-detail.html',
})
export class OrganisationDetail {
  private readonly orgsService = inject(OrganisationsService);
  private readonly fb = inject(FormBuilder);

  readonly organisation = input.required<Organisation>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly saveErrors = signal<string[]>([]);

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => this.editForm.reset({ name: this.organisation().name }));
  }

  protected save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    const org = this.organisation();
    this.orgsService.updateOrganisation(org.id, { id: org.id, name }).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }
}
