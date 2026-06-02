import { Component } from '@angular/core';
import { BottomSheetComponent } from '../../components/bottom-sheet/bottom-sheet.component';
import { NgFor, NgIf } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BottomSheetComponent,NgIf,NgFor],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  showSheet = false;

activeForm:
  | 'menu'
  | 'expense'
  | 'category'
  | 'subcategory'
  | 'budget'
= 'menu';
categories = [
  { id: 1, name: 'Food', icon: '🍔' },
  { id: 2, name: 'Travel', icon: '⛽' },
  { id: 3, name: 'Shopping', icon: '🛍' },
  { id: 4, name: 'Rent', icon: '🏠' },
  { id: 5, name: 'EMI', icon: '💳' },
  { id: 6, name: 'Utilities', icon: '⚡' }
];

selectedCategory: number | null = null;
}