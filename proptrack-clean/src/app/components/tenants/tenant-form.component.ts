import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { PropertyService } from '../../services/property.service';
import { Tenant } from '../../models/tenant.model';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tenant-form.component.html',
})
export class TenantFormComponent implements OnInit {
  form: FormGroup;
  properties: Property[] = []; 

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    private propertyService: PropertyService,
    private router: Router
  ) {
    // Initialize form fields with validation rules
    this.form = this.fb.group({
      name: ['', Validators.required],
      contact: ['', Validators.required],
      propertyId: ['', Validators.required],
      leaseStart: ['', Validators.required],
      leaseEnd: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Populate property dropdown choices on initialization
    this.propertyService.getAll().subscribe({
      // Fallback to empty array if response is null or undefined to prevent template errors
      next: (data) => this.properties = data || [], 
      error: () => alert('Failed to load properties')
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValues = this.form.value;

    // Convert input values to numbers to match database types
    const cleanTenant: Omit<Tenant, 'id'> = {
      name: formValues.name,
      contact: formValues.contact,
      propertyId: Number(formValues.propertyId),
      leaseStart: formValues.leaseStart,
      leaseEnd: formValues.leaseEnd
    };

    // Save new record to backend database
    this.tenantService.create(cleanTenant).subscribe({
      next: () => {
        this.form.reset();
        
        // Redirect to tenant listing page
        this.router.navigate(['/tenants']); 
      },
      error: () => alert('Failed to save tenant')
    });
  }
}