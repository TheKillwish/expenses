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
async getSubcategories(
  categoryId: number
) {

  const { data, error } =
    await this.supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
async addSubcategory(
  categoryId: number,
  name: string,
  icon: string
) {

  const { data, error } =
    await this.supabase
      .from('subcategories')
      .insert([
        {
          category_id: categoryId,
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
async addExpense(expense: any) {

  const { data, error } =
    await this.supabase
      .from('expenses')
      .insert([expense])
      .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
async updateCategoryBudget(
  categoryId: number,
  monthlyBudget: number,
  alertThreshold: number
) {

  const { data, error } =
    await this.supabase
      .from('categories')
      .update({
        monthly_budget: monthlyBudget,
        alert_threshold: alertThreshold
      })
      .eq('id', categoryId)
      .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
async getExpenses() {

  const { data, error } =
    await this.supabase
      .from('expenses')
      .select(`
        *,
        categories (
          name,
          icon
        )
      `)
      .order('created_at', {
        ascending: false
      });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
async deleteCategory(id: number) {

  const { error } =
    await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

  if (error) {
    console.error(error);
  }

}
async deleteSubcategory(id: number) {

  const { error } =
    await this.supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

  if (error) {
    console.error(error);
  }

}
async deleteExpense(id: number) {

  const { error } =
    await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);

  if (error) {
    console.error(error);
  }

}
}