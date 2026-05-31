import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, switchMap, take } from 'rxjs';
import { Tenant } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = 'https://api.jsonbin.io/v3/b/6a1b88c821f9ee59d29f8d42?meta=false';

  constructor(private http: HttpClient) {}

  // Fetch all tenant records
  getAll(): Observable<Tenant[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.tenants || []),
      catchError(err => throwError(() => new Error('Failed to load tenants')))
    );
  }

  // Fetch tenants assigned to a specific property (Supports string and number IDs)
  getByProperty(propId: string | number): Observable<Tenant[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const tenants: Tenant[] = res.tenants || [];
        return tenants.filter(t => String(t.propertyId) === String(propId));
      }),
      catchError(err => throwError(() => new Error('Failed to load tenants for this property')))
    );
  }

  // Save a new tenant record where ID is auto-incremented locally before the cloud push
  create(data: Omit<Tenant, 'id'>): Observable<Tenant> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentTenants = res.tenants || [];
        const nextId = currentTenants.length > 0 ? Math.max(...currentTenants.map((t: any) => Number(t.id) || 0)) + 1 : 1;
        const newTenant = { ...data, id: nextId } as Tenant;
        
        // Push modification to file tree array
        res.tenants = [...currentTenants, newTenant];
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => newTenant)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to create tenant')))
    );
  }

  // Update specific fields of an existing tenant record by ID
  update(id: number | string, changes: Partial<Tenant>): Observable<Tenant> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentTenants: Tenant[] = res.tenants || [];
        let updatedItem: Tenant | null = null;

        res.tenants = currentTenants.map(t => {
          if (String(t.id) === String(id)) {
            updatedItem = { ...t, ...changes } as Tenant;
            return updatedItem;
          }
          return t;
        });

        if (!updatedItem) return throwError(() => new Error('Tenant record not found'));

        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => updatedItem!)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to update tenant')))
    );
  }

  // Delete a tenant record by ID
  delete(id: number | string): Observable<void> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentTenants: Tenant[] = res.tenants || [];
        res.tenants = currentTenants.filter(t => String(t.id) !== String(id));
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => undefined)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to delete tenant')))
    );
  }
}