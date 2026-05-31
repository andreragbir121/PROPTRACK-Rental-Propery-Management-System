import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, switchMap, take } from 'rxjs';
import { RentPayment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // Configured to point directly to your cloud bin with metadata stripped
  private apiUrl = 'https://api.jsonbin.io/v3/b/6a1b88c821f9ee59d29f8d42?meta=false';

  constructor(private http: HttpClient) {}

  // Fetch all rent payment records
  getAll(): Observable<RentPayment[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.rentPayments || []),
      catchError(err => throwError(() => new Error('Failed to load payments')))
    );
  }

  // Fetch payments filtered by a specific property ID
  getByProperty(propId: string | number): Observable<RentPayment[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const rentPayments: RentPayment[] = res.rentPayments || [];
        return rentPayments.filter(p => String(p.propertyId) === String(propId));
      }),
      catchError(err => throwError(() => new Error('Failed to load payments for property')))
    );
  }

  // Save a new payment record
  create(data: Omit<RentPayment, 'id'>): Observable<RentPayment> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentPayments = res.rentPayments || [];
        const nextId = currentPayments.length > 0 ? Math.max(...currentPayments.map((p: any) => Number(p.id) || 0)) + 1 : 1;
        const newPayment = { ...data, id: nextId } as RentPayment;
        
        res.rentPayments = [...currentPayments, newPayment];
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => newPayment)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to create payment')))
    );
  }

  // Protect payload body by omitting primary key ID during partial structural patches
  update(id: string | number, changes: Partial<Omit<RentPayment, 'id'>>): Observable<RentPayment> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentPayments: RentPayment[] = res.rentPayments || [];
        let updatedItem: RentPayment | null = null;

        res.rentPayments = currentPayments.map(p => {
          if (String(p.id) === String(id)) {
            updatedItem = { ...p, ...changes } as RentPayment;
            return updatedItem;
          }
          return p;
        });

        if (!updatedItem) return throwError(() => new Error('Payment record not found'));

        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => updatedItem!)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to update payment')))
    );
  }

  // Delete a payment record by ID
  delete(id: string | number): Observable<void> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentPayments: RentPayment[] = res.rentPayments || [];
        res.rentPayments = currentPayments.filter(p => String(p.id) !== String(id));
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => undefined)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to delete payment')))
    );
  }
}