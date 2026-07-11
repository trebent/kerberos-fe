import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { OrganisationsService } from '../../../../api/auth-basic/api/organisations.service';
import { Organisation } from '../../../../api/auth-basic/model/organisation';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-organisation-detail',
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ErrorDisplayComponent,
  ],
})
export class OrganisationDetailComponent implements OnInit {
  private readonly orgsService = inject(OrganisationsService);
  private readonly fb = inject(FormBuilder);

  readonly organisation = input.required<Organisation>();

  readonly saved = output<void>();
  readonly closed = output<void>();

  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.editForm.reset({ name: this.organisation().name });
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    const org = this.organisation();
    this.orgsService.updateOrganisation(org.id, { id: org.id, name }).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  close(): void {
    this.closed.emit();
  }
}
