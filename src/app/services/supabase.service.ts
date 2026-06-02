import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );


  async getCategories() {

  const { data, error } = await this.supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
async addCategory(
  name: string,
  icon: string
) {

  const { data, error } =
    await this.supabase
      .from('categories')
      .insert([
        {
          name,
          icon
        }
      ])
      .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
}