import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { switchMap } from 'rxjs';
import { UsersService } from '../../../../api/admin/api/users.service';
import { User } from '../../../../api/admin/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-user-detail',
  template: `
    <section class="detail-section">
      <h4>Edit User</h4>
      @if (saveErrors().length) {
        <app-error-display [errors]="saveErrors()" />
      }
      <form [formGroup]="editForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" autocomplete="username" />
        </mat-form-field>

        @if (groupsResource.isLoading()) {
          <mat-spinner diameter="24" />
        }
        @if (groupsResource.hasValue()) {
          <fieldset class="groups-fieldset">
            <legend>Groups</legend>
            @for (g of groupsResource.value()!; track g.id) {
              <mat-checkbox [checked]="isSelected(g.id)" (change)="toggleGroup(g.id)">
                {{ g.name }}
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
    .groups-fieldset {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 4px;
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .groups-fieldset legend {
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
export class UserDetailComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly groupsResource = rxResource({
    stream: () => this.usersService.getGroups(),
  });

  readonly selectedGroupIds = signal<number[]>([]);
  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
  });

  ngOnInit(): void {
    const u = this.user();
    this.editForm.reset({ username: u.username });
    this.selectedGroupIds.set((u.groups ?? []).map(g => g.id));
  }

  isSelected(groupId: number): boolean {
    return this.selectedGroupIds().includes(groupId);
  }

  toggleGroup(groupId: number): void {
    const current = this.selectedGroupIds();
    if (current.includes(groupId)) {
      this.selectedGroupIds.set(current.filter(id => id !== groupId));
    } else {
      this.selectedGroupIds.set([...current, groupId]);
    }
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { username } = this.editForm.getRawValue();
    const userId = this.user().id;
    this.usersService.updateUser(userId, { username }).pipe(
      switchMap(() => this.usersService.updateUserGroups(userId, { groupIDs: this.selectedGroupIds() })),
    ).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
