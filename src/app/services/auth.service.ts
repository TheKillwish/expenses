import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService: SupabaseService
  ) {}

  async signInWithGoogle() {

    await this.supabaseService.supabase
      .auth.signInWithOAuth({

        provider: 'google',

        options: {

          redirectTo:
            window.location.origin + '/dashboard'

        }

      });

  }

  async getSession() {

    const { data } =
      await this.supabaseService.supabase
        .auth.getSession();

    return data.session;

  }
  async getUser() {

  const { data, error } =
    await this.supabaseService.supabase
      .auth.getUser();

  if (error) {
    console.error(error);
    return null;
  }

  return data.user;
}
async getUserId() {

  const user =
    await this.getUser();

  return user?.id;

}

async getUserProfile() {

  const {
    data: { user }
  } =
    await this.supabaseService
      .supabase
      .auth
      .getUser();

  return user;

}
async signUp(
  email: string,
  password: string
) {

  return await this.supabaseService
    .supabase
    .auth
    .signUp({
      email,
      password
    });

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

  const response =
    await this.supabaseService
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

  console.log(
    'MAGIC LINK RESPONSE:',
    response
  );

  return response;

}
}