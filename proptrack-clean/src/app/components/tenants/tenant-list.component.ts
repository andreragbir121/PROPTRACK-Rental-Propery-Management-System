import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { PropertyService } from '../../services/property.service';
import { Tenant } from '../../models/tenant.model';
import { Property } from '../../models/property.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  tenants: Tenant[] = [];
  // Look up property names by ID
  propertiesMap: { [key: number]: string } = {}; 
  loading = true;
  error: string | null = null;

  constructor(
    private tenantService: TenantService,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Fetch tenants and properties in parallel to map names to IDs
    forkJoin({
      tenants: this.tenantService.getAll(),
      properties: this.propertyService.getAll()
    }).subscribe({
      next: ({ tenants, properties }) => {
        this.tenants = tenants || [];
        
        // Build a lookup map for property names
        const lookup: { [key: number]: string } = {};
        if (properties) {
          properties.forEach(p => lookup[p.id] = p.name);
        }
        this.propertiesMap = lookup;
        
        this.loading = false;
        // Sync changes with UI immediately
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.error = err.message || 'Failed to load data collections.';
        this.loading = false;
        // Force view refresh to show error layout
        this.cdr.detectChanges(); 
      }
    });
  }

  onDelete(id: number, name: string): void {
    // Prompt confirmation before deleting a record
    if (confirm(`Are you sure you want to remove tenant "${name}"?`)) {
      this.tenantService.delete(id).subscribe({
        next: () => {
          // Refresh list after successful deletion
          this.loadData(); 
        },
        error: () => alert('Failed to completely delete the tenant record.')
      });
    }
  }
}