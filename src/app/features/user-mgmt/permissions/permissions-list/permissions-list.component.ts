import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UsersService } from '../../../../api/admin/api/users.service';
import { ErrorDisplayComponent } from '../../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-permissions-list',
  template: `
    @if (permissionsResource.isLoading()) {
      <mat-spinner diameter="32" />
    }
    @if (permissionsResource.error()) {
      <app-error-display [errors]="['Failed to load permissions.']" />
    }
    @if (permissionsResource.hasValue()) {
      <table mat-table [dataSource]="permissionsResource.value()!">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let p">{{ p.id }}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let p">{{ p.name }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  imports: [MatTableModule, MatProgressSpinnerModule, ErrorDisplayComponent],
})
export class PermissionsListComponent {
  private readonly usersService = inject(UsersService);

  readonly displayedColumns = ['id', 'name'];

  readonly permissionsResource = rxResource({
    stream: () => this.usersService.getPermissions(),
  });
}
