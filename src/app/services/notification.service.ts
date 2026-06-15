import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  async requestPermission() {

    if (
      !('Notification' in window)
    ) {

      return false;

    }

    if (
      Notification.permission ===
      'granted'
    ) {

      return true;

    }

    const permission =

      await Notification
        .requestPermission();

    return (
      permission ===
      'granted'
    );

  }

  async showNotification(
    title: string,
    body: string
  ) {

    if (
      Notification.permission !==
      'granted'
    ) {

      return;

    }

    try {

      const registration =

        await navigator
          .serviceWorker
          .ready;

      await registration
        .showNotification(
          title,
          {
            body,

            icon:
              '/assets/icons/expense.png',

            badge:
              '/assets/icons/expense.png'
          }
        );

      if (
        'vibrate' in navigator
      ) {

        navigator.vibrate(
          [200, 100, 200]
        );

      }

    }

    catch (error) {

      console.error(
        'Notification Error:',
        error
      );

    }

  }

  async showExpenseReminder() {

    await this
      .showNotification(

        '💸 What did you spend today?',

        'Take 10 seconds to log today\'s expenses before you forget.'

      );

  }

  async showInsightReminder() {

    await this
      .showNotification(

        '✨ Your Daily AI Insight Is Ready',

        'Open Rezu to see your latest spending insights.'

      );

  }

  scheduleMorningInsight() {

    const now =
      new Date();

    const next8am =
      new Date();

    next8am.setHours(
      8,
      0,
      0,
      0
    );

    if (
      next8am <= now
    ) {

      next8am.setDate(
        next8am.getDate() + 1
      );

    }

    const timeout =

      next8am.getTime() -
      now.getTime();

    setTimeout(
      () => {

        this.showInsightReminder();

      },
      timeout
    );

  }

  scheduleExpenseReminder() {

    const now =
      new Date();

    const next9pm =
      new Date();

    next9pm.setHours(
      21,
      0,
      0,
      0
    );

    if (
      next9pm <= now
    ) {

      next9pm.setDate(
        next9pm.getDate() + 1
      );

    }

    const timeout =

      next9pm.getTime() -
      now.getTime();

    setTimeout(
      () => {

        this.showExpenseReminder();

      },
      timeout
    );

  }
  scheduleNotifications() {

  this.scheduleMorningInsight();

  this.scheduleExpenseReminder();

}

}