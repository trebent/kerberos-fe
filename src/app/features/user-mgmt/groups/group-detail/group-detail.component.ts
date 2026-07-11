import { Component, effect, inject, input, output, signal } from '@angular/core';
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
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
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
export class GroupDetailComponent {
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

  constructor() {
    effect(() => {
      const g = this.group();
      this.editForm.reset({ name: g.name });
      this.selectedPermissionIds.set(g.permissions!.map(p => p.id));
    });
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
