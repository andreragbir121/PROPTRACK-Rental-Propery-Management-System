import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { RentPayment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = 'http://localhost:3000/rentPayments';

  constructor(private http: HttpClient) {}

  // Fetch all rent payment records
  getAll(): Observable<RentPayment[]> {
    return this.http.get<RentPayment[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => new Error('Failed to load payments')))
    );
  }

  // Fetch payments filtered by a specific property ID (Supports string and number IDs)
  getByProperty(propId: string | number): Observable<RentPayment[]> {
    return this.http.get<RentPayment[]>(`${this.apiUrl}?propertyId=${propId}`).pipe(
      catchError(err => throwError(() => new Error('Failed to load payments for property')))
    );
  }

  // Save a new payment record where ID is omitted as the backend handles auto-generation
  create(data: Omit<RentPayment, 'id'>): Observable<RentPayment> {
    return this.http.post<RentPayment>(this.apiUrl, data).pipe(
      catchError(err => throwError(() => new Error('Failed to create payment')))
    );
  }

  //Protect payload body by omitting primary key ID during partial structural patches
  update(id: string | number, changes: Partial<Omit<RentPayment, 'id'>>): Observable<RentPayment> {
    return this.http.patch<RentPayment>(`${this.apiUrl}/${id}`, changes).pipe(
      catchError(err => throwError(() => new Error('Failed to update payment')))
    );
  }

  // Delete a payment record by ID (Signature adjusted)
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error('Failed to delete payment')))
    );
  }
}