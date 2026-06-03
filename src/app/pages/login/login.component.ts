import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(
    private supabaseService: SupabaseService,
  private authService: AuthService,
  private router: Router,
  private uiService: UiService
) {}
magicLinkSent = false;
authMode:
  'google'
  | 'magic-link'
= 'google';

email = '';

password = '';

  async login() {

    await this.authService
      .signInWithGoogle();

  }
  async ngOnInit() {

  const user =
    await this.authService.getUser();

  if (!user) {

    return;

  }

  const profile =
    await this.supabaseService
      .getProfile();

  if (
    profile?.onboarding_completed
  ) {

    await this.router.navigate([
      '/dashboard'
    ]);

  }

  else {

    await this.router.navigate([
      '/onboarding'
    ]);

  }

}
async signUp(
  email: string,
  password: string
) {

  const result =
  await this.authService.signUp(
    email,
    password
  );

console.log(result);

alert(
  JSON.stringify(result)
);
}
async signIn(
  email: string,
  password: string
) {

  return await this.supabaseService
    .supabase
    .auth
    .signInWithPassword({
      email,
      password
    });

}
async sendMagicLink(
  email: string
) {

  return await this.supabaseService
    .supabase
    .auth
    .signInWithOtp({

      email,

      options: {

        emailRedirectTo:
          window.location.origin +
          '/dashboard'

      }

    });

}
async continueAuth() {

  if (!this.email) {

    this.uiService.showToast(
      'Please enter your email address',
      'error'
    );

    return;

  }

  this.uiService.showLoader();

  try {

    const { error } =
      await this.authService
        .sendMagicLink(
          this.email
        );

    if (error) {

      this.uiService.showToast(
        error.message,
        'error'
      );

      return;

    }

    this.uiService.showToast(
      'Magic link sent. Check your inbox.',
      'success'
    );

    this.magicLinkSent = true;

  }

  catch (error: any) {

    this.uiService.showToast(
      'Failed to send magic link',
      'error'
    );

    console.error(error);

  }

  finally {

    this.uiService.hideLoader();

  }

}

}