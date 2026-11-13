import { Component, input } from '@angular/core';

import { RequestStatus } from '../../utils/request-status';
import { ErrorDisplay } from '../error-display/error-display';

/** Shows how a {@link RequestStatus} went: its error, or its success message while it lasts. */
@Component({
  imports: [ErrorDisplay],
  selector: 'app-request-feedback',
  templateUrl: './request-feedback.html',
})
export class RequestFeedback {
  readonly status = input.required<RequestStatus>();
}
