import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';       
import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-property-list',
  standalone: true,                                   
  imports: [CommonModule, RouterModule],              
  templateUrl: './property-list.component.html',
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    
    // Fetch all properties from the backend service
    this.propertyService.getAll().subscribe({
      next: (data) => {
        this.properties = data || [];
        this.loading = false;
        // Sync async changes with UI immediately
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.error = err.message || 'Failed to load properties registry.';
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  onDelete(id: number, name: string): void {
    // Prompt confirmation before deleting a record
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.propertyService.delete(id).subscribe({
        next: () => {
          this.loadProperties(); // Refresh list after successful deletion
        },
        error: () => alert('Failed to completely delete the property record.')
      });
    }
  }
}