import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { forkJoin } from 'rxjs';
import { PropertyService } from '../../services/property.service';
import { TenantService } from '../../services/tenant.service';
import { PaymentService } from '../../services/payment.service';
import { ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,                          
  imports: [CommonModule],                 
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // Application-level component state variables
  data: any;
  loading = true;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private paymentService: PaymentService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // RxJS forkJoin executes multiple backend API HTTP requests concurrently 
    // and emits a combined object only when all four services resolve successfully.
    forkJoin({
      properties: this.propertyService.getAll(),
      tenants: this.tenantService.getAll(),
      payments: this.paymentService.getAll(),
      expenses: this.expenseService.getAll()
    }).subscribe({
      next: ({ properties, tenants, payments, expenses }) => {
        // Fallback checks: Use empty arrays if database layers return null or undefined records
        const safePayments = payments || [];
        const safeExpenses = expenses || [];
        const safeProperties = properties || [];
        const safeTenants = tenants || [];

        // Calculate total revenue derived from completed 'Paid' statuses
        const totalRent = safePayments
          .filter(p => p && p.status === 'Paid')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        //Sum up total expenditures logged in the system
        const totalExpenses = safeExpenses
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        //Determine true net operational financial standing
        const netIncome = totalRent - totalExpenses;

        //Extract occupancy percentages using database properties array 
        const occupied = safeProperties.filter(p => p && p.status === 'Occupied').length;
        const totalProperties = safeProperties.length;

        //Filter active tenants by validating lease boundaries against current time
        const activeTenants = safeTenants.filter(t => {
          if (!t || !t.leaseEnd) return false;
          return new Date(t.leaseEnd) > new Date();
        }).length;

        const recentPayments = [...safePayments]
          .filter(p => p && p.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        // Hydrate state payload with structural aggregations for template binding
        this.data = {
          totalRent,
          totalExpenses,
          netIncome,
          occupied,
          totalProperties,
          activeTenants,
          recentPayments
        };
        
        // Deactivate loading animation layout state
        this.loading = false;
        
        // Defensive Change Detection: Force Angular to process template state data mutations, avoiding common async view rendering lags.
        this.cdr.detectChanges();
      },
      
      error: (err) => {
        //Capture background network/database communication issues
        console.error("Dashboard failed to initialize: ", err);
        this.error = 'Unable to connect to service database layers.';
        this.loading = false;
        
        // Force view refresh to render error message banners on the viewport immediately
        this.cdr.detectChanges();
      }
    });
  }
}