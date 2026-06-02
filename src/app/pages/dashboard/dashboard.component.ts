import { Component, OnInit } from '@angular/core';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';
import { DatePipe, DecimalPipe, NgFor, NgIf, SlicePipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BottomSheetComponent,NgIf,NgFor,FormsModule, DatePipe,
    DecimalPipe,
    SlicePipe,],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit{
  constructor(
  private supabaseService: SupabaseService
) {}

  showSheet = false;
  categories: any[] = [];
  newCategoryName = '';
  

newCategoryIcon = '';
newSubcategoryName = '';

newSubcategoryIcon = '';
expenseAmount = 0;

selectedBudgetCategory: any = null;

budgetAmount = 0;

budgetThreshold = 80;
expenseDescription = '';
expenses: any[] = [];

totalBudget = 0;

totalSpent = 0;

remainingBudget = 0;

todaySpent = 0;

categorySummary: any[] = [];

selectedCategoryForSubcategory:
  number | null = null;
today = new Date();

activeForm:
  | 'menu'
  | 'expense'
  | 'category'
  | 'subcategory'
  | 'budget'
  | 'delete'
= 'menu';

selectedCategory: number | null = null;
subcategories: any[] = [];

selectedSubcategory: number | null = null;

showDeleteDialog = false;

deleteType:
  'category'
  | 'subcategory'
  | 'expense'
  | null = null;

selectedDeleteItem: any = null;


async ngOnInit() {

  this.categories =
    await this.supabaseService.getCategories();

  console.log(this.categories);
  await this.loadDashboard();

}
async saveCategory() {

  if (!this.newCategoryName) {
    return;
  }

  await this.supabaseService.addCategory(
    this.newCategoryName,
    this.newCategoryIcon
  );

  this.categories =
    await this.supabaseService.getCategories();

  this.newCategoryName = '';
  this.newCategoryIcon = '';
  
  this.activeForm = 'menu';

}
async selectCategory(categoryId: number) {

  this.selectedCategory = categoryId;

  this.selectedSubcategory = null;

  this.subcategories =
    await this.supabaseService
      .getSubcategories(categoryId);

}
async saveSubcategory() {

  if (
    !this.selectedCategoryForSubcategory ||
    !this.newSubcategoryName
  ) {
    return;
  }

  await this.supabaseService
    .addSubcategory(
      this.selectedCategoryForSubcategory,
      this.newSubcategoryName,
      this.newSubcategoryIcon
    );

  this.newSubcategoryName = '';
  this.newSubcategoryIcon = '';

  this.selectedCategoryForSubcategory = null;

  this.activeForm = 'menu';

}
async saveExpense() {

  if (
    !this.expenseAmount ||
    !this.selectedCategory
  ) {
    return;
  }

  await this.supabaseService
    .addExpense({

      amount: this.expenseAmount,

      category_id: this.selectedCategory,

      subcategory_id:
        this.selectedSubcategory,

      description:
        this.expenseDescription

    });

  alert('Expense Added');

  this.expenseAmount = 0;

  this.expenseDescription = '';

  this.selectedCategory = null;

  this.selectedSubcategory = null;

  this.activeForm = 'menu';

}
selectBudgetCategory(category: any) {

  this.selectedBudgetCategory = category;

  this.budgetAmount =
    category.monthly_budget || 0;

  this.budgetThreshold =
    category.alert_threshold || 80;

}
async saveBudget() {

  if (!this.selectedBudgetCategory) {
    return;
  }

  await this.supabaseService
    .updateCategoryBudget(
      this.selectedBudgetCategory.id,
      this.budgetAmount,
      this.budgetThreshold
    );

  this.categories =
    await this.supabaseService
      .getCategories();

  this.activeForm = 'menu';

}
async loadDashboard() {

  this.categories =
    await this.supabaseService
      .getCategories();

  this.expenses =
    await this.supabaseService
      .getExpenses();

  this.calculateDashboard();

}
calculateDashboard() {

  this.totalBudget =
    this.categories.reduce(
      (sum, c) => sum + (c.monthly_budget || 0),
      0
    );

  this.totalSpent =
    this.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

  this.remainingBudget =
    this.totalBudget - this.totalSpent;

  const today =
    new Date()
      .toISOString()
      .split('T')[0];

  this.todaySpent =
    this.expenses
      .filter(
        e => e.expense_date === today
      )
      .reduce(
        (sum, e) =>
          sum + Number(e.amount),
        0
      );

  this.categorySummary =
    this.categories.map(category => {

      const spent =
        this.expenses
          .filter(
            e =>
              e.category_id === category.id
          )
          .reduce(
            (sum, e) =>
              sum + Number(e.amount),
            0
          );

      return {

        ...category,

        spent,

        remaining:
          (category.monthly_budget || 0) - spent,

        percentage:
          category.monthly_budget
            ? Math.min(
                100,
                Math.round(
                  (spent * 100) /
                  category.monthly_budget
                )
              )
            : 0

      };

    });

}
openDeleteDialog(
  type: 'category' | 'subcategory' | 'expense',
  item: any
) {

  this.deleteType = type;

  this.selectedDeleteItem = item;

  this.activeForm = 'delete';

}
async confirmDelete() {
  if (
    this.deleteType === 'category' &&
    this.selectedCategory === this.selectedDeleteItem.id
  ) {

    this.selectedCategory = null;
    this.subcategories = [];

  }


  if (!this.selectedDeleteItem) {
    return;
  }

  switch (this.deleteType) {

    case 'category':

      await this.supabaseService
        .deleteCategory(
          this.selectedDeleteItem.id
        );
        if (
    this.selectedCategory ===
    this.selectedDeleteItem.id
  ) {

    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.subcategories = [];

  }

      break;

    case 'subcategory':

      await this.supabaseService
        .deleteSubcategory(
          this.selectedDeleteItem.id
        );
        if (
    this.selectedCategory ===
    this.selectedDeleteItem.id
  ) {

    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.subcategories = [];

  }

      break;

    case 'expense':

      await this.supabaseService
        .deleteExpense(
          this.selectedDeleteItem.id
        );

      break;

  }

  this.selectedDeleteItem = null;

  this.deleteType = null;

  this.activeForm = 'menu';

  await this.loadDashboard();
  


}
cancelDelete() {

  this.showDeleteDialog = false;

  this.selectedDeleteItem = null;

}
}