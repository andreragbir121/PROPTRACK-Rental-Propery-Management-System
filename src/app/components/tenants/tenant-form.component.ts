import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { PropertyService } from '../../services/property.service';
import { Tenant } from '../../models/tenant.model';
import { Property, PropertyStatus } from '../../models/property.model'; // Ensured PropertyStatus is imported [cite: 35]

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
    // Load properties to populate the dropdown selection
    this.propertyService.getAll().subscribe({
      next: (data) => this.properties = data || [], 
      error: () => alert('Failed to load properties')
    });
  }

onSubmit(): void {
  if (this.form.invalid) return;

  const formValues = this.form.value;
  
  // Parse propertyId to handle both string and number types safely
  const selectedPropertyId = isNaN(Number(formValues.propertyId)) 
    ? formValues.propertyId 
    : Number(formValues.propertyId);

  // Type payload safely matching either string or number foreign key signatures
  const cleanTenant: Omit<Tenant, 'id'> = {
    name: formValues.name,
    contact: formValues.contact,
    propertyId: selectedPropertyId as any, // Bypass strict primitive typing
    leaseStart: formValues.leaseStart,
    leaseEnd: formValues.leaseEnd
  };

  // Create tenant record in the backend database
  this.tenantService.create(cleanTenant).subscribe({
    next: () => {
      
      //update the associated property's status to Occupied after creating a tenant 
      this.propertyService.update(selectedPropertyId, { status: PropertyStatus.Occupied }).subscribe({
        next: () => {
          this.form.reset(); 
          this.router.navigate(['/tenants']);
        },
        error: (err) => {
          console.error('Property status sync failed:', err);
          alert('Tenant added, but failed to update the property status to Occupied.');
        }
      });

    },
    error: (err) => {
      console.error('Tenant generation failed:', err);
      alert('Failed to save tenant');
    }
  });
}
}