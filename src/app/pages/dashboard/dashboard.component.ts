import { Component, OnInit } from '@angular/core';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';
import { NgFor, NgIf } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BottomSheetComponent,NgIf,NgFor,FormsModule],
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

activeForm:
  | 'menu'
  | 'expense'
  | 'category'
  | 'subcategory'
  | 'budget'
= 'menu';

selectedCategory: number | null = null;
async ngOnInit() {

  this.categories =
    await this.supabaseService.getCategories();

  console.log(this.categories);

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
}