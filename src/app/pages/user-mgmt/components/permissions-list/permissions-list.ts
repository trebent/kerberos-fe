import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ErrorDisplay } from '../../../../components/error-display/error-display';
import { Skeleton } from '../../../../components/skeleton/skeleton';
import { MAT_TABLE } from '../../../../utils/material-table';
import { UsersService } from '../../../../services/admin';

/** A read-only reference list of every permission a group can be given. */
@Component({
  host: { class: 'section-card' },
  imports: [ErrorDisplay, ...MAT_TABLE, Skeleton],
  selector: 'app-permissions-list',
  styleUrl: './permissions-list.scss',
  templateUrl: './permissions-list.html',
})
export class PermissionsList {
  private readonly usersService = inject(UsersService);

  protected readonly displayedColumns = ['id', 'name'];
  protected readonly skeletonRows = ['6rem', '8rem', '5rem'];

  protected readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });
}
