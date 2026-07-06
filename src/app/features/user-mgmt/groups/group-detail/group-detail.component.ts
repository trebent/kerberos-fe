import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../../api/admin/api/users.service';
import { Group } from '../../../../api/admin/model/group';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-group-detail',
  template: `
    <section class="detail-section">
      <h4>Edit Group</h4>
      @if (saveErrors().length) {
        <app-error-display [errors]="saveErrors()" />
      }
      <form [formGroup]="editForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        @if (permissionsResource.isLoading()) {
          <mat-spinner diameter="24" />
        }
        @if (permissionsResource.hasValue()) {
          <fieldset class="permissions-fieldset">
            <legend>Permissions</legend>
            @for (p of permissionsResource.value()!; track p.id) {
              <mat-checkbox [checked]="isSelected(p.id)" (change)="togglePermission(p.id)">
                {{ p.name }}
              </mat-checkbox>
            }
          </fieldset>
        }

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
      gap: 8px;
    }
    mat-form-field {
      width: 320px;
    }
    .permissions-fieldset {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 4px;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .permissions-fieldset legend {
      font: var(--mat-sys-label-medium);
      padding: 0 4px;
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
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
  ],
})
export class GroupDetailComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly group = input.required<Group>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });

  readonly selectedPermissionIds = signal<number[]>([]);
  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    const g = this.group();
    this.editForm.reset({ name: g.name });
    this.selectedPermissionIds.set(g.permissions!.map(p => p.id));
  }

  isSelected(permissionId: number): boolean {
    return this.selectedPermissionIds().includes(permissionId);
  }

  togglePermission(permissionId: number): void {
    const current = this.selectedPermissionIds();
    if (current.includes(permissionId)) {
      this.selectedPermissionIds.set(current.filter(id => id !== permissionId));
    } else {
      this.selectedPermissionIds.set([...current, permissionId]);
    }
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    this.usersService.updateGroup(this.group().id, { name, permissionIDs: this.selectedPermissionIds() }).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
