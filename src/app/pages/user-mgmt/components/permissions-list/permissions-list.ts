import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { MAT_TABLE } from '../../../../utils/material-table';
import { UsersService } from '../../../../services/admin';

@Component({
  host: { class: 'section-card' },
  imports: [ErrorDisplay, MatProgressSpinner, ...MAT_TABLE],
  selector: 'app-permissions-list',
  styleUrl: './permissions-list.scss',
  templateUrl: './permissions-list.html',
})
export class PermissionsList {
  private readonly usersService = inject(UsersService);

  readonly displayedColumns = ['id', 'name'];

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });
}
