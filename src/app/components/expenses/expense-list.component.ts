import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { PropertyService } from '../../services/property.service';
import { Expense } from '../../models/expense.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  
  //Index type map set to accept both string and number keys safely
  propertiesMap: { [key: string | number]: string } = {}; 
  loading = true;
  error: string | null = null;

  constructor(
    private expenseService: ExpenseService,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading = true;
    
    //Fetch both expenses and properties in parallel
    forkJoin({
      expenses: this.expenseService.getAll(),
      properties: this.propertyService.getAll()
    }).subscribe({
      next: ({ expenses, properties }) => {
        this.expenses = expenses || [];
        
        const lookup: { [key: string | number]: string } = {};
        if (properties) properties.forEach(p => lookup[p.id] = p.name);
        this.propertiesMap = lookup;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.message || 'Failed to load maintenance logs.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Signature updated to accept string
  onDelete(id: string | number, desc: string): void {
    // Prompt confirmation before deleting a record
    if (confirm(`Are you sure you want to delete the expense item: "${desc}"?`)) {
      this.expenseService.delete(id).subscribe({
        next: () => this.loadExpenses(),
        error: () => alert('Failed to delete expense entry.')
      });
    }
  }
}