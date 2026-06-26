import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-org-user-detail',
  template: `
    <app-page-header title="Organisation User" icon="person" />
    <mat-card><mat-card-content>Not yet implemented.</mat-card-content></mat-card>
  `,
  imports: [MatCardModule, PageHeaderComponent],
})
export class OrgUserDetailComponent {}
