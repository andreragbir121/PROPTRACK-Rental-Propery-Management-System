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
  propertiesMap: { [key: number]: string } = {}; 
  tenantsMap: { [key: number]: string } = {}; 
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
    
    // Fetch payments, properties, and tenants in parallel
    forkJoin({
      payments: this.paymentService.getAll(),
      properties: this.propertyService.getAll(),
      tenants: this.tenantService.getAll()
    }).subscribe({
      next: ({ payments, properties, tenants }) => {
        this.payments = payments || [];
        
        //lookup map for property names
        const propLookup: { [key: number]: string } = {};
        if (properties) properties.forEach(p => propLookup[p.id] = p.name);
        this.propertiesMap = propLookup;

        //map for tenant names
        const tenantLookup: { [key: number]: string } = {};
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

  onDelete(id: number): void {
    // Prompt confirmation before deleting a record
    if (confirm('Are you sure you want to delete this payment record?')) {
      this.paymentService.delete(id).subscribe({
        next: () => this.loadPayments(),
        error: () => alert('Failed to delete payment record.')
      });
    }
  }
}