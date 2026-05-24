import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = 'http://localhost:3000/expenses';

  constructor(private http: HttpClient) {}

  // Fetch all expense records
  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.apiUrl).pipe(
      catchError(err => throwError(() => new Error('Failed to load expenses')))
    );
  }

  // Fetch expenses filtered by a specific property ID (Supports string and number IDs)
  getByProperty(propId: string | number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}?propertyId=${propId}`).pipe(
      catchError(err => throwError(() => new Error('Failed to load expenses for property')))
    );
  }

  // Save a new expense record where ID is omitted as the backend handles auto-generation
  create(data: Omit<Expense, 'id'>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, data).pipe(
      catchError(err => throwError(() => new Error('Failed to create expense')))
    );
  }

  // Update specific fields of an existing expense record by ID (Signature adjusted)
  update(id: string | number, changes: Partial<Expense>): Observable<Expense> {
    return this.http.patch<Expense>(`${this.apiUrl}/${id}`, changes).pipe(
      catchError(err => throwError(() => new Error('Failed to update expense')))
    );
  }

  // Delete an expense record by ID (Signature adjusted)
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => new Error('Failed to delete expense')))
    );
  }
}