import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';       
import { PropertyService } from '../../services/property.service';
import { Property } from '../../models/property.model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-property-list',
  standalone: true,                                   
  imports: [CommonModule, RouterModule],              
  templateUrl: './property-list.component.html',
})
export class PropertyListComponent implements OnInit {
  // Master data stream tracking source inputs from backend
  private propertiesSubject = new BehaviorSubject<Property[]>([]);
  
  // Reactive search input term anchor subject string stream
  private searchSubject = new BehaviorSubject<string>('');
  
  // Expose fully combined filter stream directly to template async pipes
  filteredProperties$!: Observable<Property[]>;

  loading = true;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // 1. Initialize the parallel reactive combination stream pipeline logic
    this.filteredProperties$ = combineLatest([
      this.propertiesSubject.asObservable(),
      this.searchSubject.asObservable().pipe(startWith(''))
    ]).pipe(
      map(([properties, searchTerm]) => {
        const cleanTerm = searchTerm.toLowerCase().trim();
        if (!cleanTerm) return properties;
        
        // Filter elements reactive mapping across dynamic field boundaries
        return properties.filter(p => 
          p.name.toLowerCase().includes(cleanTerm) || 
          p.address.toLowerCase().includes(cleanTerm)
        );
      })
    );

    // Fetch data payload records
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    
    this.propertyService.getAll().subscribe({
      next: (data) => {
        const rawList = data || [];
        this.propertiesSubject.next(rawList); // Emits raw data list downstream
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.error = err.message || 'Failed to load properties registry.';
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

  // Parameter signatures widened to accept string or number IDs safely
  onDelete(id: string | number, name: string): void {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.propertyService.delete(id).subscribe({
        next: () => {
          // Reload the properties list after deletion to reflect changes
          this.loadProperties(); 
        },
        error: () => alert('Failed to completely delete the property record.')
      });
    }
  }
}