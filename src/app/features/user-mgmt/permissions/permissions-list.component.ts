import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../api/admin/api/users.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-permissions-list',
  templateUrl: './permissions-list.component.html',
  imports: [MatTableModule, MatProgressSpinnerModule, ErrorDisplayComponent],
})
export class PermissionsListComponent {
  private readonly usersService = inject(UsersService);

  readonly displayedColumns = ['id', 'name'];

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });
}
