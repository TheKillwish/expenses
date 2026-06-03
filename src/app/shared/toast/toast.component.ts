import {
  Component,
  Input
} from '@angular/core';

import {
  NgClass,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    NgClass,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault
  ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {

  @Input()
  message = '';

  @Input()
  type:
    'success'
    | 'error'
    | 'info' = 'success';

}