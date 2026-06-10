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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('categories')
      .insert([
        {
          name,
          icon,
          user_id: userId
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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('user_id', userId)
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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('subcategories')
      .insert([
        {
          category_id: categoryId,
          name,
          icon,
          user_id: userId
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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('expenses')
      .insert([
        {
          ...expense,
          user_id: userId
        }
      ])
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

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('categories')
      .update({
        monthly_budget: monthlyBudget,
        alert_threshold: alertThreshold
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
async getExpenses() {

  const userId =
  await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('expenses')
      .select(`
        *,
        categories (
          id,
          name,
          icon
        )
      `)
      .eq('user_id', userId)
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
async deleteCategory(id: number) {

  const userId =
  await this.getCurrentUserId();

  const { error } =
    await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

  if (error) {
    console.error(error);
  }

}
async deleteSubcategory(id: number) {

  const userId =
  await this.getCurrentUserId();

  const { error } =
    await this.supabase
      .from('subcategories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

  if (error) {
    console.error(error);
  }

}
async deleteExpense(id: number) {

  const userId =
  await this.getCurrentUserId();

  const { error } =
    await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

  if (error) {
    console.error(error);
  }

}
async getCurrentUserId() {

  const {
    data: { user }
  } =
    await this.supabase.auth.getUser();

  return user?.id;

}
async updateExpense(
  expense: any
) {

  const userId =
    await this.getCurrentUserId();

  const { data, error } =
    await this.supabase
      .from('expenses')
      .update({

        category_id:
          expense.category_id,

        subcategory_id:
          expense.subcategory_id,

        amount:
          expense.amount,

        description:
          expense.description,

        expense_date:
          expense.expense_date

      })
      .eq(
        'id',
        expense.id
      )
      .eq(
        'user_id',
        userId
      )
      .select();

  if (error) {

    console.error(error);

    return null;

  }

  return data;

}
async getProfile() {

  const {
    data: { user }
  } =
    await this.supabase.auth.getUser();

  if (!user) {

    return null;

  }

  const { data, error } =
  await this.supabase
    .from('user_profiles')
    .select('*')
    .eq(
      'user_id',
      user.id
    )
    .maybeSingle();

  if (error) {

    console.error(error);

    return null;

  }

  return data;

}
async createProfile() {

  const {
    data: { user }
  } =
    await this.supabase.auth.getUser();

  console.log(
    'CREATE PROFILE USER:',
    user
  );

  const { data, error } =
    await this.supabase
      .from('user_profiles')
      .insert([
        {
          user_id: user?.id,
          onboarding_completed: false
        }
      ])
      .select()
      .single();

  console.log(
    'CREATE PROFILE DATA:',
    data
  );

  console.log(
    'CREATE PROFILE ERROR:',
    error
  );

  return data;

}

async updateProfile(
  data: any
): Promise<boolean> {

  const {
    data: { user }
  } =
    await this.supabase.auth.getUser();

  if (!user) {

    return false;

  }

  const { error } =
    await this.supabase
      .from('user_profiles')
      .update(data)
      .eq(
        'user_id',
        user.id
      );

  if (error) {

    console.error(error);

    return false;

  }

  return true;

}
async hasGeneratedToday():

Promise<boolean> {

  const today =

    new Date()
      .toISOString()
      .split('T')[0];

  const {
    data,
    error
  } =

    await this.supabase

      .from(
        'ai_insights'
      )

      .select(
        'id'
      )

      .gte(
        'created_at',
        `${today}T00:00:00`
      )

      .limit(1)

      .maybeSingle();

  return !!data;

}

}