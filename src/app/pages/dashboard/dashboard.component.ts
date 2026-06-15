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
import {NotificationService} from "../../services/notification.service"
import {
  NgZone
} from '@angular/core';
import Tesseract
from 'tesseract.js';
import {
  ViewChild,
  ElementRef
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
   private ngZone: NgZone,
   private notificationService: NotificationService

) {}
@ViewChild('receiptInput')
receiptInput!: ElementRef<HTMLInputElement>;
isListening = false;
isScanningReceipt = false;
activeAiMode:
  'voice' |
  'receipt' |
  null = null;
expenseSearch = '';

filteredExpenses: any[] = [];

isProcessingVoice = false;
private recognition: any;
restartVoice = false;
voiceTranscript = '';
selectedReceiptFile: File | null = null;

receiptPreview: string | null = null;

isReceiptPreviewOpen = false;

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
  await this.notificationService
  .requestPermission();
  localStorage.setItem(
  'rezu_notifications',
  'true'
);

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
  await this.calculateAiEligibility();
  const result =
  await this.supabaseService
    .getLatestInsight();

this.latestInsight =
  result.latestInsight;

this.hasGeneratedToday =
  result.hasTodayInsight;

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
    this.filteredExpenses =
  [...this.expenses];
  console.log("expenses: ",this.filteredExpenses)
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
  this.activeAiMode =
  'voice';

this.clearReceipt();

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

      switch (
        event.error
      ) {

        case 'not-allowed':

          this.isListening = false;

          this.uiService.showToast(
            'Microphone permission denied',
            'error'
          );

          break;

        case 'network':

          this.isListening = false;

          this.uiService.showToast(
            'Network error during voice recognition',
            'error'
          );

          break;

        case 'no-speech':

          // Ignore completely

          break;

        default:

          this.isListening = false;

          this.uiService.showToast(
            'Voice recognition failed',
            'error'
          );

      }

    });

  };

  this.recognition.onend =
  () => {

    setTimeout(
      async () => {

        if (
          this.voiceTranscript
            ?.trim()
        ) {

          await this.stopListening();

        }

        else {

          this.isListening =
            false;

        }

      },
      200
    );

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

  if (
    !result?.success
  ) {

    this.uiService.showToast(
      'No expense detected',
      'error'
    );

    return;

  }

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

  else {

    this.uiService.showToast(
      'Category not found',
      'error'
    );

    return;

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

    result.description
      ?.trim() || '';

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

  this.isListening = false;

  const transcript =

    this.voiceTranscript
      ?.trim();

  if (
    !transcript
  ) {

    return;

  }

  if (
    transcript.length < 3
  ) {

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

  }

}
speakAgain() {

  this.voiceTranscript = '';

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
      console.log("result: ",result)

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
async calculateAiEligibility() {

  const profile =
    await this.supabaseService
      .getProfile();

  const expenses =
    await this.supabaseService
      .getExpenses();

  const createdDate =
    new Date(
      profile.created_at
    );

  const today =
    new Date();

  const accountAgeDays =
    Math.floor(
      (
        today.getTime() -
        createdDate.getTime()
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    );

  this.aiEligibility = {

    expenseCount:
      expenses.length,

    accountAgeDays,

    eligible:
      expenses.length >= 10 &&
      accountAgeDays >= 7

  };

}
onReceiptSelected(
  event: any
) {

  const file =
    event.target.files?.[0];

  if (!file) {

    return;

  }

  this.selectedReceiptFile =
    file;

  const reader =
    new FileReader();

  reader.onload =
    () => {

      this.receiptPreview =
        reader.result as string;

      this.isReceiptPreviewOpen =
        true;

    };

  reader.readAsDataURL(
    file
  );
  this.activeAiMode =
  'receipt';

this.voiceTranscript =
  '';

this.isListening =
  false;

}
async extractText(
  image: Blob
): Promise<string> {

  const {
    data: {
      text
    }
  } = await Tesseract
    .recognize(
      image,
      'eng'
    );

  return text;

}
async useReceipt() {

  if (
    !this.selectedReceiptFile
  ) {

    return;

  }

  this.isScanningReceipt =
    true;

  this.uiService.showLoader();

  try {

    const enhancedImage =

  await this.preprocessImage(
    this.selectedReceiptFile
  );

const text =

  await this.extractText(
    enhancedImage
  );

console.log(
  'OCR TEXT:',
  text
);

    const result =
      await this.aiService
        .parseExpense(
          text
        );
      console.log("Text output:",result)

    if (
      !result?.success
    ) {

      this.uiService.showToast(
        'Unable to understand receipt',
        'error'
      );

      return;

    }

    await this.populateExpenseForm(
      result
    );

    this.uiService.showToast(
      'Receipt scanned successfully',
      'success'
    );

    this.clearReceipt();

  }

  catch (error) {

    console.error(error);

    this.uiService.showToast(
      'Receipt scan failed',
      'error'
    );

  }

  finally {

    this.isScanningReceipt =
      false;

    this.uiService.hideLoader();

  }

}
uploadAnotherReceipt() {

  this.selectedReceiptFile =
    null;

  this.receiptPreview =
    null;

  this.isReceiptPreviewOpen =
    false;

  this.receiptInput
    ?.nativeElement
    .click();

}
clearReceipt() {

  this.selectedReceiptFile =
    null;

  this.receiptPreview =
    null;

  this.isReceiptPreviewOpen =
    false;

  if (
    this.activeAiMode ===
    'receipt'
  ) {

    this.activeAiMode =
      null;

  }

  if (
  this.receiptInput
) {

  this.receiptInput
    .nativeElement
    .value = '';

}

}
resetVoiceMode() {

  this.voiceTranscript =
    '';

  this.isListening =
    false;

  if (
    this.activeAiMode ===
    'voice'
  ) {

    this.activeAiMode =
      null;

  }

}
async preprocessImage(
  file: File
): Promise<Blob> {

  return new Promise(
    (resolve) => {

      const image =
        new Image();

      const reader =
        new FileReader();

      reader.onload =
        (e: any) => {

          image.src =
            e.target.result;

        };

      image.onload =
        () => {

          const canvas =
            document.createElement(
              'canvas'
            );

          const ctx =
            canvas.getContext(
              '2d'
            )!;

          canvas.width =
            image.width;

          canvas.height =
            image.height;

          ctx.drawImage(
            image,
            0,
            0
          );

          const imageData =
            ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

          const data =
            imageData.data;

          for (
            let i = 0;
            i < data.length;
            i += 4
          ) {

            const avg =

              (
                data[i] +
                data[i + 1] +
                data[i + 2]
              ) / 3;

            const contrast =
              avg > 140
                ? 255
                : 0;

            data[i] =
              contrast;

            data[i + 1] =
              contrast;

            data[i + 2] =
              contrast;

          }

          ctx.putImageData(
            imageData,
            0,
            0
          );

          canvas.toBlob(
            (blob) => {

              resolve(blob!);

            },
            'image/png'
          );

        };

      reader.readAsDataURL(
        file
      );

    }
  );

}filterExpenses() {

  const search =

    this.expenseSearch
      .toLowerCase()
      .trim();

  if (
    !search
  ) {

    this.filteredExpenses =
      [...this.expenses];

    return;

  }

  this.filteredExpenses =

    this.expenses.filter(
      (expense: any) => {

        return (

          expense.description
            ?.toLowerCase()
            .includes(search)

          ||

          expense.categories?.name
            ?.toLowerCase()
            .includes(search)

          ||

          expense.subcategories?.name
            ?.toLowerCase()
            .includes(search)

          ||

          expense.amount
            ?.toString()
            .includes(search)

          ||

          expense.expense_date
            ?.includes(search)

        );

      }
    );

}
async testNotification() {

  const granted =

    await this.notificationService
      .requestPermission();

  console.log(
    'Permission:',
    granted
  );

  if (
    granted
  ) {

    await this.notificationService
      .showNotification(

        'Rezu Test',

        'Notifications are working 🎉'

      );

  }

}

}