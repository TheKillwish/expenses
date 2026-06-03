import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UiService {

  loading$ =
    new BehaviorSubject(false);

  toast$ =
    new BehaviorSubject<any>(null);

  showLoader() {

    this.loading$.next(true);

  }

  hideLoader() {

    this.loading$.next(false);

  }

  showToast(
    message: string,
    type:
      'success'
      | 'error'
      | 'info' = 'success'
  ) {

    this.toast$.next({
      message,
      type
    });

    setTimeout(() => {

      this.toast$.next(null);

    }, 3000);

  }

}