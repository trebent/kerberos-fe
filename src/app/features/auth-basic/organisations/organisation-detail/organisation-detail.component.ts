import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OrganisationsService } from '../../../../api/auth-basic/api/organisations.service';
import { Organisation } from '../../../../api/auth-basic/model/organisation';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-organisation-detail',
  template: `
    <section class="detail-section">
      <h4>Edit Organisation</h4>
      @if (saveErrors().length) {
        <app-error-display [errors]="saveErrors()" />
      }
      <form [formGroup]="editForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <div class="form-actions">
          <button mat-flat-button type="submit" [disabled]="editForm.invalid">Save</button>
          <button mat-button type="button" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .detail-section {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
    }
    h4 {
      margin: 0 0 12px;
    }
    form {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    mat-form-field {
      width: 320px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
  `],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ErrorDisplayComponent,
  ],
})
export class OrganisationDetailComponent implements OnInit {
  private readonly orgsService = inject(OrganisationsService);
  private readonly fb = inject(FormBuilder);

  readonly organisation = input.required<Organisation>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

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

  cancel(): void {
    this.cancelled.emit();
  }
}
