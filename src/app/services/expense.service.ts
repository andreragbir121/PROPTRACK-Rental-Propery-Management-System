import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, switchMap, take } from 'rxjs';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private apiUrl = 'https://api.jsonbin.io/v3/b/6a1b88c821f9ee59d29f8d42?meta=false';

  constructor(private http: HttpClient) {}

  // Fetch all expense records
  getAll(): Observable<Expense[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.expenses || []),
      catchError(err => throwError(() => new Error('Failed to load expenses')))
    );
  }

  // Fetch expenses filtered by a specific property ID
  getByProperty(propId: string | number): Observable<Expense[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const expenses: Expense[] = res.expenses || [];
        return expenses.filter(e => String(e.propertyId) === String(propId));
      }),
      catchError(err => throwError(() => new Error('Failed to load expenses for property')))
    );
  }

  // Save a new expense record
  create(data: Omit<Expense, 'id'>): Observable<Expense> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentExpenses = res.expenses || [];
        const nextId = currentExpenses.length > 0 ? Math.max(...currentExpenses.map((e: any) => Number(e.id) || 0)) + 1 : 1;
        const newExpense = { ...data, id: nextId } as Expense;
        
        // Push modification to file tree array
        res.expenses = [...currentExpenses, newExpense];
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => newExpense)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to create expense')))
    );
  }

  // Update specific fields of an existing expense record by ID
  update(id: string | number, changes: Partial<Expense>): Observable<Expense> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentExpenses: Expense[] = res.expenses || [];
        let updatedItem: Expense | null = null;

        res.expenses = currentExpenses.map(e => {
          if (String(e.id) === String(id)) {
            updatedItem = { ...e, ...changes } as Expense;
            return updatedItem;
          }
          return e;
        });

        if (!updatedItem) return throwError(() => new Error('Expense record not found'));

        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => updatedItem!)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to update expense')))
    );
  }

  // Delete an expense record by ID
  delete(id: string | number): Observable<void> {
    return this.http.get<any>(this.apiUrl).pipe(
      take(1),
      switchMap(res => {
        const currentExpenses: Expense[] = res.expenses || [];
        res.expenses = currentExpenses.filter(e => String(e.id) !== String(id));
        
        return this.http.put<any>(this.apiUrl, res).pipe(
          map(() => undefined)
        );
      }),
      catchError(err => throwError(() => new Error('Failed to delete expense')))
    );
  }
}