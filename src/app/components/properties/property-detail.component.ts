import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { TenantService } from '../../services/tenant.service';
import { PaymentService } from '../../services/payment.service';
import { ExpenseService } from '../../services/expense.service';
import { Property } from '../../models/property.model';
import { Tenant } from '../../models/tenant.model';
import { RentPayment } from '../../models/payment.model';
import { Expense } from '../../models/expense.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-detail.component.html',
})
export class PropertyDetailComponent implements OnInit {
  property: Property | null = null;
  associatedTenants: Tenant[] = [];
  associatedPayments: RentPayment[] = [];
  associatedExpenses: Expense[] = [];
  
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private paymentService: PaymentService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get the raw property ID from the current route path parameter string
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.error = 'Invalid property identifier provided.';
      this.loading = false;
      return;
    }

    // Safely parse the value: keep as string if it contains characters, convert if pure digits
    const propertyId = isNaN(Number(idParam)) ? idParam : Number(idParam);

    this.loading = true;

    // Fetch the target property details and all its related records in parallel using forkJoin
    forkJoin({
      property: this.propertyService.getById(propertyId),
      tenants: this.tenantService.getByProperty(propertyId as any),   // Using type safety fallback
      payments: this.paymentService.getByProperty(propertyId as any), // for secondary services
      expenses: this.expenseService.getByProperty(propertyId as any)
    }).subscribe({
      next: ({ property, tenants, payments, expenses }) => {
        this.property = property;
        this.associatedTenants = tenants || [];
        this.associatedPayments = payments || [];
        this.associatedExpenses = expenses || [];
        
        this.loading = false;
        // Sync changes with UI immediately to avoid any old data rendering issues
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error fetching property breakdown details:', err);
        this.error = 'Failed to load details for this property registry entry.';
        this.loading = false;
        // Force view refresh to show error layout
        this.cdr.detectChanges(); 
      }
    });
  }
}