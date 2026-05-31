import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core'; 
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
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
  private isBrowser: boolean;
  
  // Model setup handling a flexible string or number signature
  expense: Omit<Expense, 'id'> = {
    propertyId: '' as any,
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
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object 
  ) {
    this.isBrowser = isPlatformBrowser(platformId); 
  }

  ngOnInit(): void {
    // Populate dropdown options on load
    this.propertyService.getAll().subscribe({
      next: (data) => {
        this.properties = data || [];
        //Prevent rendering delay on initial click
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Failed to load properties:', err);
        if (this.isBrowser) {
          alert('Failed to load properties');
        }
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    //parse propertyId. Keeps string value if alphanumeric
    const parsedPropertyId = isNaN(Number(this.expense.propertyId))
      ? this.expense.propertyId
      : Number(this.expense.propertyId);

    const cleanPayload: Omit<Expense, 'id'> = {
      propertyId: parsedPropertyId as any,
      description: this.expense.description,
      amount: Number(this.expense.amount),
      date: this.expense.date,
      type: this.expense.type
    };

    // Save record to backend database
    this.expenseService.create(cleanPayload).subscribe({
      next: () => {
        form.resetForm();
        //Direct user back to main index
        this.router.navigate(['/expenses']); 
      },
      error: (err) => {
        console.error('Failed to save expense record:', err);
        if (this.isBrowser) {
          alert('Failed to save expense record');
        }
      }
    });
  }
}