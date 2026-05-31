import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs'; // 🌟 Added map
import { Property } from '../models/property.model';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private apiUrl = 'https://api.jsonbin.io/v3/b/6a1b88c821f9ee59d29f8d42?meta=false';

  constructor(private http: HttpClient) {}

  // Fetch all property records
  getAll(): Observable<Property[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.properties || []),
      catchError(err => throwError(() => new Error('Failed to load properties')))
    );
  }

  // Fetch a single property by its ID (Simulated client-side lookup)
  getById(id: string | number): Observable<Property> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const properties: Property[] = res.properties || [];
        const found = properties.find(p => String(p.id) === String(id));
        if (!found) throw new Error('Property not found');
        return found;
      }),
      catchError(err => throwError(() => new Error('Failed to load property')))
    );
  }

  // Save a new property record
  create(data: Omit<Property, 'id'>): Observable<Property> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const currentProps = res.properties || [];
        const nextId = currentProps.length > 0 ? Math.max(...currentProps.map((p: any) => Number(p.id) || 0)) + 1 : 1;
        const newProperty = { ...data, id: nextId } as Property;
        
        // Append new property to existing list inside the whole object structure
        res.properties = [...currentProps, newProperty];
        return { fullPayload: res, newItem: newProperty };
      }),
      // Send the full updated object back to JSONBin via PUT
      map(payloadContainer => {
        this.http.put(this.apiUrl, payloadContainer.fullPayload).subscribe();
        return payloadContainer.newItem;
      }),
      catchError(err => throwError(() => new Error('Failed to create property')))
    );
  }

  // Update specific fields of an existing property record by ID
  update(id: string | number, changes: Partial<Property>): Observable<Property> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const currentProps: Property[] = res.properties || [];
        let updatedItem: Property | null = null;

        res.properties = currentProps.map(p => {
          if (String(p.id) === String(id)) {
            updatedItem = { ...p, ...changes };
            return updatedItem;
          }
          return p;
        });

        if (!updatedItem) throw new Error('Property not found to update');
        return { fullPayload: res, item: updatedItem };
      }),
      map(payloadContainer => {
        this.http.put(this.apiUrl, payloadContainer.fullPayload).subscribe();
        return payloadContainer.item;
      }),
      catchError(err => throwError(() => new Error('Failed to update property')))
    );
  }

  // Delete a property record by ID
  delete(id: string | number): Observable<void> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const currentProps: Property[] = res.properties || [];
        res.properties = currentProps.filter(p => String(p.id) !== String(id));
        return res;
      }),
      map(fullPayload => {
        this.http.put(this.apiUrl, fullPayload).subscribe();
        return;
      }),
      catchError(err => throwError(() => new Error('Failed to delete property')))
    );
  }
}