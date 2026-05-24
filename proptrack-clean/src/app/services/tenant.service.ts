import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Tenant } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = 'http://localhost:3000/tenants';

  constructor(private http: HttpClient) {}

  // Fetch all tenant records
  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => new Error('Failed to load tenants')))
    );
  }

// Fetch tenants assigned to a specific property (Updated to support both string and number IDs)
getByProperty(propId: string | number): Observable<Tenant[]> {
  return this.http.get<Tenant[]>(`${this.apiUrl}?propertyId=${propId}`).pipe(
    catchError(err => throwError(() => new Error('Failed to load tenants for this property')))
  );
}

  // Save a new tenant record where ID is omitted as the backend handles auto-generation
  create(data: Omit<Tenant, 'id'>): Observable<Tenant> {
    return this.http.post<Tenant>(this.apiUrl, data).pipe(
      catchError(err => throwError(() => new Error('Failed to create tenant')))
    );
  }

  // Update specific fields of an existing tenant record by ID
  update(id: number, changes: Partial<Tenant>): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.apiUrl}/${id}`, changes).pipe(
      catchError(err => throwError(() => new Error('Failed to update tenant')))
    );
  }

  // Delete a tenant record by ID
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error('Failed to delete tenant')))
    );
  }
}