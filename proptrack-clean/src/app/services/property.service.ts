import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Property } from '../models/property.model';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private apiUrl = 'http://localhost:3000/properties';

  constructor(private http: HttpClient) {}

  // Fetch all property records
  getAll(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => new Error('Failed to load properties')))
    );
  }

  // Fetch a single property by its ID (Supports string and number IDs)
  getById(id: string | number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error('Failed to load property')))
    );
  }

  // Save a new property record where ID is omitted as the backend handles auto-generation
  create(data: Omit<Property, 'id'>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, data).pipe(
      catchError(err => throwError(() => new Error('Failed to create property')))
    );
  }

  // Update specific fields of an existing property record by ID
  update(id: string | number, changes: Partial<Property>): Observable<Property> {
    return this.http.patch<Property>(`${this.apiUrl}/${id}`, changes).pipe(
      catchError(err => throwError(() => new Error('Failed to update property')))
    );
  }

  // Delete a property record by ID
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error('Failed to delete property')))
    );
  }
}