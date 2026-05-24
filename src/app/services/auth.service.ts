import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SECRET_PIN = '5678';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Expose the authentication state as an observable for components to react to changes
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // Synchronous getter for the guard to check quickly
  get isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Validate the PIN entered by the user
  login(pin: string): boolean {
    if (pin === this.SECRET_PIN) {
      this.isAuthenticatedSubject.next(true);
      return true;
    }
    return false;
  }

  // Log out method if needed later
  logout(): void {
    this.isAuthenticatedSubject.next(false);
  }
}