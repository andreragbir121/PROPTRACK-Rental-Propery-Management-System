import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { PropertyService } from '../../services/property.service';
import { Tenant } from '../../models/tenant.model';
import { Property, PropertyStatus } from '../../models/property.model'; 
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  // Master data stream tracking source inputs from backend
  private tenantsSubject = new BehaviorSubject<Tenant[]>([]);
  
  // Reactive search input term anchor subject string stream
  private searchSubject = new BehaviorSubject<string>('');
  
  // Expose fully combined filter stream directly to template async pipes
  filteredTenants$!: Observable<Tenant[]>;

  // Flexible lookup map for property names supporting alphanumeric keys
  propertiesMap: { [key: string | number]: string } = {}; 
  loading = true;
  error: string | null = null;

  constructor(
    private tenantService: TenantService,
    private propertyService: PropertyService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize the parallel reactive combination stream pipeline logic
    this.filteredTenants$ = combineLatest([
      this.tenantsSubject.asObservable(),
      this.searchSubject.asObservable().pipe(startWith(''))
    ]).pipe(
      map(([tenants, searchTerm]) => {
        const cleanTerm = searchTerm.toLowerCase().trim();
        if (!cleanTerm) return tenants;
        
        // Live filters matches across tenant names or linked contact details
        return tenants.filter(t => 
          t.name.toLowerCase().includes(cleanTerm) ||
          t.contact.toLowerCase().includes(cleanTerm)
        );
      })
    );

    // Fetch data payload records
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    forkJoin({
      tenants: this.tenantService.getAll(),
      properties: this.propertyService.getAll()
    }).subscribe({
      next: ({ tenants, properties }) => {
        // Push raw tenant list to stream handler
        this.tenantsSubject.next(tenants || []);
        
        // Build a flexible lookup map for property names supporting alphanumeric keys
        const lookup: { [key: string | number]: string } = {};
        if (properties) {
          properties.forEach(p => lookup[p.id] = p.name);
        }
        this.propertiesMap = lookup;
        
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.error = err.message || 'Failed to load data collections.';
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  // Reactive input hook tied directly to change stream emitters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onDelete(tenant: Tenant): void {
    if (confirm(`Are you sure you want to remove tenant "${tenant.name}"?`)) {
      
      const linkedPropertyId = tenant.propertyId;

      this.tenantService.delete(tenant.id).subscribe({
        next: () => {
          
          // After tenant deletion, update the associated property's status back to Vacant
          this.propertyService.update(linkedPropertyId, { status: PropertyStatus.Vacant }).subscribe({
            next: () => {
              this.loadData(); // Refresh datasets on completion
            },
            error: (err) => {
              console.error('Property status patch back to vacant failed: ', err);
              this.loadData(); // Fallback data reload
            }
          });

        },
        error: () => alert('Failed to completely delete the tenant record.')
      });
    }
  }
}