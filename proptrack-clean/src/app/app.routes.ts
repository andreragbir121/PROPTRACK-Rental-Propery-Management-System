import { Routes } from '@angular/router';

// 1. Core Structural Modules (Existing)
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

// 2. Properties Module Components
import { PropertyListComponent } from './components/properties/property-list.component';
import { PropertyDetailComponent } from './components/properties/property-detail.component';
import { PropertyFormComponent } from './components/properties/property-form.component'; 

// 3. Tenants Module Components
import { TenantListComponent } from './components/tenants/tenant-list.component';
import { TenantFormComponent } from './components/tenants/tenant-form.component';

// 4. Payments Module Components
import { PaymentListComponent } from './components/payments/payment-list.component';
import { PaymentFormComponent } from './components/payments/payment-form.component'; 

// 5. Expenses Module Components
import { ExpenseListComponent } from './components/expenses/expense-list.component';
import { ExpenseFormComponent } from './components/expenses/expense-form.component'; 

export const routes: Routes = [
  { path: '', component: DashboardComponent},
  
  { path: 'properties', component: PropertyListComponent},
  { path: 'properties/new', component: PropertyFormComponent},
  { path: 'properties/:id', component: PropertyDetailComponent},
  
  { path: 'tenants', component: TenantListComponent},
  { path: 'tenants/new', component: TenantFormComponent},
  
  { path: 'payments', component: PaymentListComponent},
  { path: 'payments/new', component: PaymentFormComponent,},
  
  { path: 'expenses', component: ExpenseListComponent,},
  { path: 'expenses/new', component: ExpenseFormComponent,},
  
  { path: '**', component: NotFoundComponent }
];