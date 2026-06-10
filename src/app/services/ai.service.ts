import { Injectable }
from '@angular/core';

import {
  SupabaseService
}
from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {

  constructor(

    private supabaseService:
      SupabaseService

  ) {}

  async parseExpense(
    text: string
  ) {

    const { data, error } =

      await this
        .supabaseService
        .supabase
        .functions
        .invoke(

          'parse-expense',

          {

            body: {

              text

            }

          }

        );

    if (error) {

      throw error;

    }

    return data;

  }

}