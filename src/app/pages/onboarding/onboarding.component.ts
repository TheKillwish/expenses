import { Component } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import {
  Router
} from '@angular/router';
import { UiService } from '../../services/ui.service';
import { CommonModule } from '@angular/common';
import {
  DEFAULT_CATEGORIES
} from '../../constants/default-categories';
import {
  FormsModule
} from '@angular/forms';
@Component({
  selector: 'app-onboarding',
  standalone: true,
 imports: [
  CommonModule,
  FormsModule
],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
     private router: Router,
     private uiService: UiService
  ) {}
  step = 1;

selectedCategories: any[] = [];
monthlyIncome = 0;
allocationTotal = 0;

remainingAllocation = 100;

allocationError =false;
selectedSubcategories: any[] = [];
customCategories: any[] = [];
categories: any[] = [];
isSelected(
  category: any
): boolean {

  return this.selectedCategories
    .some(
      x =>
        x.name === category.name
    );

}

async ngOnInit() {

  console.log(
    'ONBOARDING INIT'
  );

  this.categories =
    [...DEFAULT_CATEGORIES];

}
toggleCategory(
  category: any
) {

  const exists =
    this.selectedCategories
      .find(
        x =>
          x.name === category.name
      );

  if (exists) {

    this.selectedCategories =
      this.selectedCategories
        .filter(
          x =>
            x.name !== category.name
        );

  }

  else {

    this.selectedCategories
      .push(category);

  }

}
nextStep() {

  switch (this.step) {

    case 1:

      if (
        !this.selectedCategories.length
      ) {

        this.uiService.showToast(
          'Select at least one category',
          'error'
        );

        return;

      }

      this.step = 2;

      break;

    case 2:

      if (
        !this.selectedSubcategories.length
      ) {

        this.uiService.showToast(
          'Select at least one subcategory',
          'error'
        );

        return;

      }

      this.step = 3;

      break;

    case 3:

      if (
        !this.monthlyIncome ||
        this.monthlyIncome <= 0
      ) {

        this.uiService.showToast(
          'Enter your monthly income',
          'error'
        );

        return;

      }

      this.step = 4;

      break;
case 4:

  const total =
    this.selectedCategories
      .reduce(

        (
          sum,
          category
        ) =>

          sum +
          Number(
            category.percentage || 0
          ),

        0

      );

  if (total > 100) {

    this.uiService.showToast(
      'Allocation cannot exceed 100%',
      'error'
    );

    return;

  }

  this.step = 5;

  break;
  case 5:

      this.createBudget();

      break;

  }

}
isSubcategorySelected(
  categoryName: string,
  subcategory: string
): boolean {

  return this.selectedSubcategories
    .some(
      x =>
        x.category === categoryName &&
        x.name === subcategory
    );

}
toggleSubcategory(
  categoryName: string,
  subcategory: string
) {

  const exists =
    this.selectedSubcategories
      .find(
        x =>
          x.category === categoryName &&
          x.name === subcategory
      );

  if (exists) {

    this.selectedSubcategories =
      this.selectedSubcategories
        .filter(
          x =>
            !(
              x.category === categoryName &&
              x.name === subcategory
            )
        );

  }

  else {

    this.selectedSubcategories
      .push({
        category: categoryName,
        name: subcategory
      });

  }

}
getAllocationTotal(): number {

  return this.selectedCategories
    .reduce(

      (
        total,
        category
      ) =>

        total +
        Number(
          category.percentage || 0
        ),

      0

    );

}
async createBudget() {

  try {

    this.uiService.showLoader();

    const categoryMap =
      new Map();

    for (
      const category
      of this.selectedCategories
    ) {

      const budgetAmount =

        (
          this.monthlyIncome *
          (
            category.percentage || 0
          )
        ) / 100;

      const createdCategory =

        await this.supabaseService
          .addCategory(

            category.name,

            category.icon

          );

      const categoryId =

        createdCategory?.[0]?.id;

      if (!categoryId) {

        continue;

      }

      categoryMap.set(

        category.name,

        categoryId

      );

      await this.supabaseService
        .updateCategoryBudget(

          categoryId,

          budgetAmount,

          80

        );

    }

    for (
      const sub
      of this.selectedSubcategories
    ) {

      const categoryId =

        categoryMap.get(
          sub.category
        );

      if (!categoryId) {

        continue;

      }

      await this.supabaseService
        .addSubcategory(

          categoryId,

          sub.name,

          '📌'

        );

    }

    await this.supabaseService
      .updateProfile({

        monthly_income:
          this.monthlyIncome,

        onboarding_completed:
          true

      });

    this.uiService.showToast(

      'Budget created successfully',

      'success'

    );

    await this.router.navigate([
      '/dashboard'
    ]);

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(

      'Unable to create budget',

      'error'

    );

  }

  finally {

    this.uiService.hideLoader();

  }

}
validateAllocation() {

  this.allocationTotal =
    this.selectedCategories
      .reduce(

        (
          total,
          category
        ) =>

          total +
          Number(
            category.percentage || 0
          ),

        0

      );

  this.remainingAllocation =
    100 -
    this.allocationTotal;
  console.log(this.allocationTotal)

  this.allocationError =
    this.allocationTotal < 100;
  console.log(this.allocationError)
  

}
autoAllocateBudget() {

  const recommended: any = {

    'Rent': 30,
    'Food': 15,
    'Travel': 10,
    'Utilities': 8,
    'Medical': 5,
    'Shopping': 10,
    'EMI': 10,
    'Personal Development': 5,
    'Office': 2,
    'Entertainment': 5

  };

  let totalWeight = 0;

  this.selectedCategories
    .forEach(
      (category: any) => {

        totalWeight +=

          recommended[
            category.name
          ] || 5;

      }
    );

  this.selectedCategories
  .forEach(
    (category: any) => {

      const weight =

        recommended[
          category.name
        ] || 5;

      const TARGET_BUDGET = 80;

const calculatedValue =

  Math.round(
    (
      weight /
      totalWeight
    ) * TARGET_BUDGET
  );



      this.animatePercentage(
        category,
        calculatedValue
      );

    }
  );

  this.validateAllocation();

}
animatePercentage(
  category: any,
  target: number
) {

  category.percentage = 0;

  const interval =

    setInterval(() => {

      category.percentage++;

      this.validateAllocation();

      if (
        category.percentage >=
        target
      ) {

        category.percentage =
          target;

        this.validateAllocation();

        clearInterval(
          interval
        );

      }

    }, 15);

}

}
