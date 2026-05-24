import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { PropertyStatus, Property } from '../../models/property.model';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './property-form.component.html',
})
export class PropertyFormComponent {
  form: FormGroup;
  // Expose status enum to the HTML template for dropdown
  PropertyStatus = PropertyStatus; 

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private router: Router
  ) {
    // Initialize form fields with validation rules
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      monthlyRent: [0, [Validators.required, Validators.min(1)]],
      status: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValues = this.form.value;
    
    // Convert input values to numbers to match database types
    const cleanProperty: Omit<Property, 'id'> = {
      name: formValues.name,
      address: formValues.address,
      monthlyRent: Number(formValues.monthlyRent),
      status: formValues.status,
      description: formValues.description || ''
    };

    // Save new record to backend database
    this.propertyService.create(cleanProperty).subscribe({
      next: () => {
        this.form.reset();
        // Redirect to the property listing page
        this.router.navigate(['/properties']); 
      },
      error: () => alert('Failed to save property')
    });
  }
}