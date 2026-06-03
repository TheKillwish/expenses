import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';

import { LoaderComponent } from './shared/loader/loader.component';
import { ToastComponent } from './shared/toast/toast.component';

import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    LoaderComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
 title = 'rezu-expenses';
  showLoader = false;

  toast: any = null;

  constructor(
    private uiService: UiService
  ) {

    this.uiService.loading$
      .subscribe(
        value => {
          this.showLoader = value;
        }
      );

    this.uiService.toast$
      .subscribe(
        value => {
          this.toast = value;
        }
      );

  }

}