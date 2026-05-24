import { Routes } from '@angular/router';

// Core Structural Modules (Existing)
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

// Properties Module Components
import { PropertyListComponent } from './components/properties/property-list.component';
import { PropertyDetailComponent } from './components/properties/property-detail.component';
import { PropertyFormComponent } from './components/properties/property-form.component'; 

// Tenants Module Components
import { TenantListComponent } from './components/tenants/tenant-list.component';
import { TenantFormComponent } from './components/tenants/tenant-form.component';

// Payments Module Components
import { PaymentListComponent } from './components/payments/payment-list.component';
import { PaymentFormComponent } from './components/payments/payment-form.component'; 

// Expenses Module Components
import { ExpenseListComponent } from './components/expenses/expense-list.component';
import { ExpenseFormComponent } from './components/expenses/expense-form.component'; 

// Security Additions (PIN Guard Implementation)
import { PinEntryComponent } from './components/pin-entry/pin-entry.component';
import { pinGuard } from './guards/pin.guard';

export const routes: Routes = [
  // Public route — Anyone can access this page to provide verification
  { path: 'pin-entry', component: PinEntryComponent },

  // Protected Routes Group. Require a valid PIN entry session before unlocking
  {
    path: '',
    canActivate: [pinGuard],
    children: [
      { path: '', component: DashboardComponent },
      
      { path: 'properties', component: PropertyListComponent },
      { path: 'properties/new', component: PropertyFormComponent },
      { path: 'properties/:id', component: PropertyDetailComponent },
      
      { path: 'tenants', component: TenantListComponent },
      { path: 'tenants/new', component: TenantFormComponent },
      
      { path: 'payments', component: PaymentListComponent },
      { path: 'payments/new', component: PaymentFormComponent },
      
      { path: 'expenses', component: ExpenseListComponent },
      { path: 'expenses/new', component: ExpenseFormComponent }
    ]
  },
  
  // Wildcard redirection fallback if an unmapped route path is specified
  { path: '**', component: NotFoundComponent }
];