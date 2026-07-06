import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { UsersService } from '../../../../api/auth-basic/api/users.service';
import { User } from '../../../../api/auth-basic/model/user';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';
import { OrgUserDetailComponent } from '../org-user-detail/org-user-detail.component';

@Component({
  selector: 'app-org-users-list',
  template: `
    @if (orgId() === null) {
      <p class="prompt-message">Select an organisation above to manage its users.</p>
    } @else {
      @if (usersResource.isLoading()) {
        <mat-spinner diameter="32" />
      }
      @if (usersResource.error()) {
        <app-error-display [errors]="['Failed to load users.']" />
      }

      <div class="action-bar">
        @if (!showCreate()) {
          <button mat-flat-button (click)="openCreate()">
            <mat-icon>add</mat-icon> Create User
          </button>
        }
      </div>

      @if (showCreate()) {
        <section class="form-section">
          <h4>Create User</h4>
          @if (createErrors().length) {
            <app-error-display [errors]="createErrors()" />
          }
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
            </mat-form-field>
            <div class="form-actions">
              <button mat-flat-button type="submit" [disabled]="createForm.invalid">Create</button>
              <button mat-button type="button" (click)="cancelCreate()">Cancel</button>
            </div>
          </form>
        </section>
      }

      @if (usersResource.hasValue()) {
        <table mat-table [dataSource]="usersResource.value()!">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let u">{{ u.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let u">{{ u.name }}</td>
          </ng-container>
          <ng-container matColumnDef="groups">
            <th mat-header-cell *matHeaderCellDef>Groups</th>
            <td mat-cell *matCellDef="let u">{{ u.groups?.length ? u.groups!.map(g => g.name).join(', ') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button (click)="openEdit(u)" aria-label="Edit user">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteUser(u.id)" aria-label="Delete user">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      }

      @if (selectedUser() && orgId() !== null) {
        <app-org-user-detail
          [orgId]="orgId()!"
          [user]="selectedUser()!"
          (saved)="onDetailSaved()"
          (cancelled)="onDetailCancelled()"
        />
      }
    }
  `,
  styles: [`
    .prompt-message {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .action-bar {
      margin-bottom: 16px;
    }
    .form-section {
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
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent,
    OrgUserDetailComponent,
  ],
})
export class OrgUsersListComponent {
  private readonly usersService = inject(UsersService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number | null>();

  readonly displayedColumns = ['id', 'name', 'groups', 'actions'];

  readonly usersResource = rxResource({
    params: () => this.orgId(),
    stream: ({ params: orgId }) => {
      if (orgId === null) {
        return of<User[]>([]);
      }
      return this.usersService.listUsers(orgId);
    },
  });

  readonly showCreate = signal(false);
  readonly createErrors = signal<string[]>([]);
  readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly selectedUser = signal<User | null>(null);

  openCreate(): void {
    this.createForm.reset();
    this.createErrors.set([]);
    this.selectedUser.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.orgId() === null) return;
    this.createErrors.set([]);
    const { name, password } = this.createForm.getRawValue();
    this.usersService.createUser(this.orgId()!, { name, password }).subscribe({
      next: () => {
        this.showCreate.set(false);
        this.createForm.reset();
        this.usersResource.reload();
      },
      error: () => {
        this.createErrors.set(['Failed to create user. Please try again.']);
      },
    });
  }

  openEdit(user: User): void {
    this.showCreate.set(false);
    this.selectedUser.set(user);
  }

  onDetailSaved(): void {
    this.selectedUser.set(null);
    this.usersResource.reload();
  }

  onDetailCancelled(): void {
    this.selectedUser.set(null);
  }

  deleteUser(userId: number): void {
    if (this.orgId() === null) return;
    if (this.selectedUser()?.id === userId) {
      this.selectedUser.set(null);
    }
    this.usersService.deleteUser(this.orgId()!, userId).subscribe({
      next: () => this.usersResource.reload(),
    });
  }
}
