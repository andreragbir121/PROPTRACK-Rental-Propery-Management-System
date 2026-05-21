import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';
import { Expense, ExpenseType } from '../../models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './expense-form.component.html',
})
export class ExpenseFormComponent implements OnInit {
  properties: Property[] = [];
  
  // Model setup omitting auto-generated primary key ID
  expense: Omit<Expense, 'id'> = {
    propertyId: 0,
    description: '',
    amount: 0,
    date: '',
    type: '' as ExpenseType
  };

  ExpenseType = ExpenseType; 

  constructor(
    private expenseService: ExpenseService,
    private propertyService: PropertyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Populate dropdown options on load
    this.propertyService.getAll().subscribe({
      next: (data) => {
        this.properties = data || [];
        this.cdr.detectChanges(); // Prevent rendering delay on initial click
      },
      error: () => alert('Failed to load properties')
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    // Convert input values to numbers to match database types
    const cleanPayload: Omit<Expense, 'id'> = {
      propertyId: Number(this.expense.propertyId),
      description: this.expense.description,
      amount: Number(this.expense.amount),
      date: this.expense.date,
      type: this.expense.type
    };

    // Save record to backend database
    this.expenseService.create(cleanPayload).subscribe({
      next: () => {
        form.resetForm();
        this.router.navigate(['/expenses']); // Direct user back to main index
      },
      error: () => alert('Failed to save expense record')
    });
  }
}