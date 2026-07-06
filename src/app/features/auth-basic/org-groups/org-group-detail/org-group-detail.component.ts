import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatInputModule,
    ErrorDisplayComponent,
  ],
})
export class OrgGroupDetailComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);

  readonly orgId = input.required<number>();
  readonly group = input.required<Group>();

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly saveErrors = signal<string[]>([]);

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.editForm.reset({ name: this.group().name });
  }

  save(): void {
    if (this.editForm.invalid) return;
    this.saveErrors.set([]);
    const { name } = this.editForm.getRawValue();
    const g = this.group();
    this.groupsService.updateGroup(this.orgId(), g.id, { id: g.id, name }).subscribe({
      next: () => this.saved.emit(),
      error: () => this.saveErrors.set(['Failed to save. Please try again.']),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
