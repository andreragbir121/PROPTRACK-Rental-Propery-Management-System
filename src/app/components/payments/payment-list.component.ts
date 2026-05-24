import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PropertyService } from '../../services/property.service';
import { TenantService } from '../../services/tenant.service';
import { RentPayment } from '../../models/payment.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-list.component.html',
})
export class PaymentListComponent implements OnInit {
  payments: RentPayment[] = [];
  
  propertiesMap: { [key: string | number]: string } = {}; 
  tenantsMap: { [key: string | number]: string } = {}; 
  
  loading = true;
  error: string | null = null;

  constructor(
    private paymentService: PaymentService,
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    
    // Fetch payments, properties, and tenants in parallel using forkJoin
    forkJoin({
      payments: this.paymentService.getAll(),
      properties: this.propertyService.getAll(),
      tenants: this.tenantService.getAll()
    }).subscribe({
      next: ({ payments, properties, tenants }) => {
        // Get today's date stripped of its timestamp for an accurate day-by-day calendar comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        //Check each payment and flag as 'Late' if it is past due
        this.payments = (payments || []).map(payment => {
          const expectedDate = new Date(payment.date);
          // Set to midnight to prevent comparing hour ticks
          expectedDate.setHours(0, 0, 0, 0); 

          if (payment.status === 'Pending' && expectedDate < today) {
            //Instantly update the local UI model bound item
            payment.status = 'Late' as any;

            //Fire an automatic, silent service update to keep db.json permanently in sync
            this.paymentService.update(payment.id, { status: 'Late' as any }).subscribe({
              error: (err) => console.error(`Failed to auto-update late record ID ${payment.id}:`, err)
            });
          }
          return payment;
        });
        
        // Lookup map for property names using explicit ID mapping
        const propLookup: { [key: string | number]: string } = {};
        if (properties) properties.forEach(p => propLookup[p.id] = p.name);
        this.propertiesMap = propLookup;

        // Lookup map for tenant names using explicit ID mapping
        const tenantLookup: { [key: string | number]: string } = {};
        if (tenants) tenants.forEach(t => tenantLookup[t.id] = t.name);
        this.tenantsMap = tenantLookup;

        this.loading = false;
        // Sync async changes with UI immediately
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.error = err.message || 'Failed to load payments ledger.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Adjusted parameter signature to cleanly execute deletions for string or number entries
  onDelete(id: string | number): void {
    // Prompt confirmation before executing delete record action (Section 9 Criteria)
    if (confirm('Are you sure you want to delete this payment record?')) {
      this.paymentService.delete(id).subscribe({
        next: () => this.loadPayments(), // Refreshes list automatically following confirmed deletion
        error: () => alert('Failed to delete payment record.')
      });
    }
  }
}