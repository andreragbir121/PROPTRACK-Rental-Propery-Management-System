import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core'; // 🌟 Added Inject & PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PropertyService } from '../../services/property.service';
import { TenantService } from '../../services/tenant.service';
import { RentPayment, PaymentStatus } from '../../models/payment.model';  
import { Property } from '../../models/property.model';
import { Tenant } from '../../models/tenant.model';                       
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  properties: Property[] = [];
  allTenants: Tenant[] = [];       
  filteredTenants: Tenant[] = [];  
  form: FormGroup;
  private isBrowser: boolean; 

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object 
  ) {
    this.isBrowser = isPlatformBrowser(platformId); 
    
    this.form = this.fb.group({
      propertyId: ['', Validators.required],
      tenantId: [{ value: '', disabled: true }, Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    forkJoin({
      properties: this.propertyService.getAll(),
      tenants: this.tenantService.getAll()
    }).subscribe({
      next: ({ properties, tenants }) => {
        this.properties = properties || [];
        this.allTenants = tenants || [];
        
        // Forces UI layout to draw dropdown options immediately on click
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load form lookup records:', err);
        if (this.isBrowser) {
          alert('Failed to load property or tenant selection data.');
        }
      }
    });

    //filter tenants array whenever property selection changes
    this.form.get('propertyId')?.valueChanges.subscribe((selectedPropertyId) => {
      const tenantControl = this.form.get('tenantId');
      
      if (selectedPropertyId) {
        // Enforce safe matching against template-bound IDs
        this.filteredTenants = this.allTenants.filter(
          (t) => String(t.propertyId) === String(selectedPropertyId)
        );
        
        tenantControl?.reset('');
        tenantControl?.enable();
      } else {
        this.filteredTenants = [];
        tenantControl?.reset('');
        tenantControl?.disable();
      }
      
      // Force change detection loop so the tenant dropdown instantly renders filtered items
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    // Use getRawValue() to read properties even when form fields are currently disabled
    const rawValues = this.form.getRawValue();
    
    //Safely parse values. Fall back to raw string if alphanumeric characters exist to prevent NaN
    const parsedPropertyId = isNaN(Number(rawValues.propertyId)) ? rawValues.propertyId : Number(rawValues.propertyId);
    const parsedTenantId = isNaN(Number(rawValues.tenantId)) ? rawValues.tenantId : Number(rawValues.tenantId);

    const cleanPayload: Omit<RentPayment, 'id'> = {
      propertyId: parsedPropertyId as any,
      tenantId: parsedTenantId as any,
      amount: Number(rawValues.amount),
      date: rawValues.date,
      status: rawValues.status as PaymentStatus
    };

    this.paymentService.create(cleanPayload).subscribe({
      next: () => {
        this.form.reset();
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        console.error('Failed to save payment record:', err);
        if (this.isBrowser) {
          alert('Failed to save payment record');
        }
      }
    });
  }
}