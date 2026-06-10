import { Component, OnInit } from '@angular/core';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';
import { DatePipe, DecimalPipe, NgFor, NgIf, SlicePipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UiService } from '../../services/ui.service';
import {
  AiService
}
from '../../services/ai.service';
import {
  NgZone
} from '@angular/core';
declare var webkitSpeechRecognition: any;

declare var SpeechRecognition: any;
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
  private supabaseService: SupabaseService,
  private authService: AuthService,
   private router: Router,
   private uiService: UiService,
   private aiService: AiService,
   private ngZone: NgZone
) {}
isListening = false;

isProcessingVoice = false;
private recognition: any;
restartVoice = false;
voiceTranscript = '';

transcript = '';
loading = true;
avatarError = false;
visibleExpenses = 5;
  showSheet = false;
  categories: any[] = [];
  newCategoryName = '';
  editingExpense: any = null;
  

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
user: any = null;

showUserMenu = false;
latestInsight: any = null;
hasGeneratedToday =
  false;

isGeneratingInsight =
  false;

aiEligibility = {

  expenseCount: 0,

  accountAgeDays: 0,

  eligible: false

};
deleteType:
  'category'
  | 'subcategory'
  | 'expense'
  | null = null;

deleteId: number | null = null;
expenseDate =
  new Date()
    .toISOString()
    .split('T')[0];

selectedDeleteItem: any = null;
currentMonth =
  new Date().toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric'
    }
  );

async ngOnInit() {

  this.loading = true;

  const user =
    await this.authService.getUser();

  if (!user) {

    await this.router.navigate(['/']);

    return;

  }

  let profile =
    await this.supabaseService
      .getProfile();

  if (!profile) {

    profile =
      await this.supabaseService
        .createProfile();

  }

  if (
    !profile?.onboarding_completed
  ) {

    await this.router.navigate([
      '/onboarding'
    ]);

    return;

  }

  this.user =
    await this.authService
      .getUserProfile();

  await this.loadDashboard();
  this.hasGeneratedToday =
  await this.supabaseService
    .hasGeneratedToday();

if (
  this.hasGeneratedToday
) {

  await this.loadLatestInsight();

}

  this.loading = false;

}
async saveCategory() {

  if (!this.newCategoryName) {

    this.uiService.showToast(
      'Please enter a category name',
      'error'
    );

    return;

  }

  this.uiService.showLoader();

  try {

    await this.supabaseService
      .addCategory(
        this.newCategoryName,
        this.newCategoryIcon
      );

    this.categories =
      await this.supabaseService
        .getCategories();

    this.newCategoryName = '';

    this.newCategoryIcon = '';

    this.activeForm = 'menu';

    await this.loadDashboard();
    

    this.uiService.showToast(
      'Category created successfully',
      'success'
    );

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Failed to create category',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

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

    this.uiService.showToast(
      'Please select a category and enter a subcategory name',
      'error'
    );

    return;

  }

  this.uiService.showLoader();

  try {

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

    await this.loadDashboard();

    this.uiService.showToast(
      'Subcategory created successfully',
      'success'
    );

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Failed to create subcategory',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

}
async saveExpense() {

  this.uiService.showLoader();

  try {

    if (this.editingExpense) {

      await this.supabaseService
        .updateExpense({

          id:
            this.editingExpense.id,

          category_id:
            this.selectedCategory,

          subcategory_id:
            this.selectedSubcategory,

          amount:
            this.expenseAmount,

          description:
            this.expenseDescription,

          expense_date:
            this.expenseDate

        });

      this.uiService.showToast(
        'Expense updated successfully',
        'success'
      );

    }

    else {

      await this.supabaseService
        .addExpense({

          category_id:
            this.selectedCategory,

          subcategory_id:
            this.selectedSubcategory,

          amount:
            this.expenseAmount,

          description:
            this.expenseDescription,

          expense_date:
            this.expenseDate

        });

      this.uiService.showToast(
        'Expense added successfully',
        'success'
      );

    }
    this.resetExpenseForm();
    this.editingExpense = null;

    this.showSheet = false;
    
    await this.loadDashboard();

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Failed to save expense',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

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

    this.uiService.showToast(
      'Please select a category',
      'error'
    );

    return;

  }

  this.uiService.showLoader();

  try {

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

    await this.loadDashboard();

    this.uiService.showToast(
      'Budget updated successfully',
      'success'
    );

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Failed to update budget',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

}
async loadDashboard() {

  this.uiService.showLoader();

  try {

    this.categories =
      await this.supabaseService
        .getCategories();

    const expenses =
      await this.supabaseService
        .getExpenses();

    this.expenses =
      expenses.sort(
        (a: any, b: any) =>
          new Date(
            b.expense_date
          ).getTime() -
          new Date(
            a.expense_date
          ).getTime()
      );

    this.calculateDashboard();

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Failed to load dashboard',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

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
deleteExpenseItem(
  expense: any
) {

  this.deleteType =
    'expense';

  this.deleteId =
    expense.id;

  this.activeForm =
    'delete';

  this.showSheet =
    true;

}
cancelDelete() {

  this.showDeleteDialog = false;

  this.selectedDeleteItem = null;

}
async login() {

  await this.authService
    .signInWithGoogle();

}
async logout() {

  await this.supabaseService.supabase
    .auth.signOut();

  await this.router.navigate(['/']);

}
get visibleExpenseList() {

  return this.expenses
    .slice(0, this.visibleExpenses);

}
loadMoreExpenses() {

  this.visibleExpenses += 5;
  

}
async editExpense(
  expense: any
) {

  this.editingExpense =
    expense;

  this.selectedCategory =
    expense.category_id;

  await this.selectCategory(
    expense.category_id
  );

  this.selectedSubcategory =
    expense.subcategory_id;

  this.expenseAmount =
    expense.amount;

  this.expenseDescription =
    expense.description;

  this.expenseDate =
    expense.expense_date;

  this.activeForm =
    'expense';

  this.showSheet =
    true;

}
async confirmDelete() {

  if (!this.deleteId) {

    return;

  }

  this.uiService.showLoader();

  try {

    switch (this.deleteType) {

      case 'category':

        await this.supabaseService
          .deleteCategory(
            this.deleteId
          );

        break;

      case 'subcategory':

        await this.supabaseService
          .deleteSubcategory(
            this.deleteId
          );

        break;

      case 'expense':

        await this.supabaseService
          .deleteExpense(
            this.deleteId
          );

        break;

    }

    this.uiService.showToast(
      `${this.deleteType} deleted successfully`,
      'success'
    );

    this.showSheet = false;

    this.activeForm = 'menu';

    this.deleteId = null;

    this.deleteType = null;

    await this.loadDashboard();

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Delete failed',
      'error'
    );

  }

  finally {

    this.uiService.hideLoader();

  }

}
async checkOnboarding() {

  let profile =
    await this.supabaseService
      .getProfile();

  console.log(
    'PROFILE:',
    profile
  );

  if (!profile) {

    profile =
      await this.supabaseService
        .createProfile();

    console.log(
      'CREATED PROFILE:',
      profile
    );

  }

  if (
    !profile?.onboarding_completed
  ) {

    await this.router.navigate([
      '/onboarding'
    ]);

    return;

  }

  this.user =
    await this.authService
      .getUserProfile();

  await this.loadDashboard();

}
resetExpenseForm() {

  this.selectedCategory = null;

  this.selectedSubcategory = null;

  this.expenseAmount = 0;

  this.expenseDescription = '';

  this.expenseDate =
    new Date()
      .toISOString()
      .split('T')[0];

}
async testAI() {

  try {

    this.uiService
      .showLoader();

    const result =

      await this
        .aiService
        .parseExpense(

          'Paid 250 for lunch'

        );

    console.log(
      result
    );

    this.uiService
      .showToast(

        'AI Parsed Successfully',

        'success'

      );

  }

  catch (error: any) {

  console.error(
    'FULL ERROR:',
    error
  );

  if (
    error?.context
  ) {

    const responseText =
      await error.context.text();

    console.log(
      'EDGE FUNCTION RESPONSE:',
      responseText
    );

  }

    this.uiService
      .showToast(

        'AI Failed',

        'error'

      );

  }

  finally {

    this.uiService
      .hideLoader();

  }

}
async startVoiceExpense() {

  if (
    this.isListening
  ) {

    return;

  }

  const SpeechRecognitionApi =

    (window as any)
      .SpeechRecognition ||

    (window as any)
      .webkitSpeechRecognition;

  if (
    !SpeechRecognitionApi
  ) {

    this.uiService.showToast(

      'Voice recognition is not supported on this browser',

      'error'

    );

    return;

  }

  this.voiceTranscript = '';

  this.isListening = true;

  this.recognition =
    new SpeechRecognitionApi();

  this.recognition.lang =
    'en-IN';

  this.recognition.interimResults =
    false;

  this.recognition.continuous =
    false;

  this.recognition.maxAlternatives =
    1;

  this.recognition.onresult =
  (event: any) => {

    const result =

      event.results[
        event.resultIndex
      ];

    if (
      result.isFinal
    ) {

      this.ngZone.run(() => {

        this.voiceTranscript =

          result[0]
            .transcript
            .trim();

      });

    }

  };

  this.recognition.onerror =
    (event: any) => {

      console.error(
        'Speech Recognition Error:',
        event
      );

      this.ngZone.run(() => {

        this.isListening =
          false;

        this.restartVoice =
          false;

        switch (
          event.error
        ) {

          case 'not-allowed':

            this.uiService.showToast(

              'Microphone permission denied',

              'error'

            );

            break;

          case 'network':

            this.uiService.showToast(

              'Network error during voice recognition',

              'error'

            );

            break;

          case 'no-speech':

  if (
    !this.voiceTranscript
  ) {

    this.uiService.showToast(

      'No speech detected',

      'error'

    );

  }


            break;

          default:

            this.uiService.showToast(

              'Voice recognition failed',

              'error'

            );

        }

      });

    };

  this.recognition.onend =
    async () => {

      /*
       * User clicked Speak Again
       */

      if (
        this.restartVoice
      ) {

        this.restartVoice =
          false;

        setTimeout(() => {

          this.startVoiceExpense();

        }, 300);

        return;

      }

      /*
       * User manually stopped
       */

      if (
        !this.isListening
      ) {

        return;

      }

      await this.stopListening();

    };

  try {

    console.log(
      'STARTING RECOGNITION'
    );

    this.recognition.start();

  }

  catch (error) {

    console.error(
      error
    );

    this.isListening =
      false;

    this.restartVoice =
      false;

    this.uiService.showToast(

      'Unable to start voice recognition',

      'error'

    );

  }

}
async parseVoiceExpense(
  text: string
) {

  try {

    this.uiService.showLoader();

    const result =

      await this.aiService
        .parseExpense(
          text
        );

    console.log(
      result
    );

    if (
      !result.success
    ) {

      this.uiService.showToast(

        'Unable to understand expense',

        'error'

      );

      return;

    }

    this.populateExpenseForm(
      result
    );

  }

  catch (
    error
  ) {

    console.error(
      error
    );

    this.uiService.showToast(

      'AI parsing failed',

      'error'

    );

  }

  finally {

    this.uiService.hideLoader();

  }

}
async populateExpenseForm(
  result: any
) {

  const category =

    this.categories.find(

      (x: any) =>

        x.name
          ?.toLowerCase()
          .trim() ===

        result.category
          ?.toLowerCase()
          .trim()

    );

  if (
    category
  ) {

    await this.selectCategory(
      category.id
    );

  }

  const subcategory =

    this.subcategories.find(

      (x: any) =>

        x.name
          ?.toLowerCase()
          .trim() ===

        result.subcategory
          ?.toLowerCase()
          .trim()

    );

  if (
    subcategory
  ) {

    this.selectedSubcategory =
      subcategory.id;

  }

  this.expenseAmount =
    Number(
      result.amount
    ) || 0;

  this.expenseDescription =
    result.description ?? '';

  this.expenseDate =
  result.date ||
  new Date()
    .toISOString()
    .split('T')[0];

  this.editingExpense =
    null;

  this.showSheet =
    true;

}
async stopListening() {

  try {

    this.recognition?.stop();

  }

  catch (error) {

    console.error(
      'Failed to stop recognition',
      error
    );

  }

  this.isListening = false;

  const transcript =

    this.voiceTranscript
      ?.trim();

  /*
   * User closed immediately
   */

  if (
    !transcript
  ) {

    this.voiceTranscript = '';

    this.uiService.showToast(

      'No speech detected',

      'error'

    );

    return;

  }

  /*
   * Extremely short speech
   */

  if (
    transcript.length < 3
  ) {

    this.voiceTranscript = '';

    this.uiService.showToast(

      'Please speak a little more clearly',

      'error'

    );

    return;

  }

  this.isProcessingVoice = true;

  this.uiService.showLoader();

  try {

    const result =

      await this.aiService
        .parseExpense(
          transcript
        );

    console.log(
      'AI RESULT:',
      result
    );

    /*
     * AI returned error
     */

    if (
      !result ||
      !result.success
    ) {

      this.uiService.showToast(

        'Unable to understand expense',

        'error'

      );

      return;

    }

    /*
     * Missing amount
     */

    if (
      !result.amount
    ) {

      this.uiService.showToast(

        'Could not detect amount',

        'error'

      );

      return;

    }

    await this.populateExpenseForm(
      result
    );

    this.uiService.showToast(

      'Expense detected successfully',

      'success'

    );

  }

  catch (error) {

    console.error(
      'VOICE PARSE ERROR:',
      error
    );

    this.uiService.showToast(

      'Failed to process expense',

      'error'

    );

  }

  finally {

    this.uiService.hideLoader();

    this.isProcessingVoice = false;

    this.voiceTranscript = '';

  }

}
speakAgain() {

  this.voiceTranscript = '';

  this.restartVoice = true;

  this.isListening = false;

  try {

    this.recognition?.stop();

  }

  catch (error) {

    console.error(error);

    this.restartVoice = false;

    this.startVoiceExpense();

  }

}
async testInsights() {

  const result =

    await this.supabaseService
      .supabase
      .functions
      .invoke(
        'generate-insights'
      );

  console.log(
    result
  );
await this.loadLatestInsight();
}

async loadLatestInsight() {

  const { data, error } =

    await this.supabaseService
      .supabase
      .from(
        'ai_insights'
      )
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .single();

  if (
    !error &&
    data
  ) {

    this.latestInsight =
      data;

  }

}
async checkTodaysInsight() {

  const today =

    new Date()
      .toISOString()
      .split('T')[0];

  const {

    data

  } =

    await this.supabaseService
      .supabase
      .from(
        'ai_insights'
      )
      .select(`
        id,
        title,
        summary,
        action,
        severity,
        metrics,
        created_at
      `)
      .gte(
        'created_at',
        `${today}T00:00:00`
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .maybeSingle();

  if (
    data
  ) {

    this.hasGeneratedToday =
      true;

    this.latestInsight =
      data;

  }

}

async generateTodaysInsight() {

  if (
    this.isGeneratingInsight
  ) {

    return;

  }

  this.isGeneratingInsight =
    true;

  this.uiService.showLoader();

  try {

    const result =

      await this.supabaseService
        .supabase
        .functions
        .invoke(
          'generate-insights'
        );

    if (
      result.data?.success
    ) {

      this.latestInsight = {

        ...result.data.insight,

        metrics:
          result.data.metrics

      };

      this.hasGeneratedToday =
        true;

      this.uiService.showToast(

        'AI insight generated',

        'success'

      );

    }

  }

  catch {

    this.uiService.showToast(

      'Failed to generate insight',

      'error'

    );

  }

  finally {

    this.uiService.hideLoader();

    this.isGeneratingInsight =
      false;

  }

}

}