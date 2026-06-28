export * from './groups.service';
import { GroupsService } from './groups.service';
export * from './organisations.service';
import { OrganisationsService } from './organisations.service';
export * from './users.service';
import { UsersService } from './users.service';
export const APIS = [GroupsService, OrganisationsService, UsersService];
