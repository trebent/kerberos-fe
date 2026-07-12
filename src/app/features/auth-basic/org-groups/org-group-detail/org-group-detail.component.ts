import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { GroupsService } from '../../../../api/auth-basic/api/groups.service';
import { Group } from '../../../../api/auth-basic/model/group';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-org-group-detail',
  templateUrl: './org-group-detail.component.html',
  styleUrl: './org-group-detail.component.scss',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ErrorDisplayComponent,
  ],
})
export class OrgGroupDetailComponent {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number>();
  readonly group = input.required<Group>();

  readonly closed = output<void>();
  readonly dataChanged = output<void>();

  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      this.editForm.reset({ name: this.group().name });
    });
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    const g = this.group();
    this.groupsService.updateGroup(this.orgId(), g.id, { id: g.id, name }).subscribe({
      next: () => {
        this.dataChanged.emit();
        this.closed.emit();
      },
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  close(): void {
    this.closed.emit();
  }
}
