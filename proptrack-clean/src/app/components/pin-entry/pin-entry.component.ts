import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pin-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pin-entry.component.html',
})
export class PinEntryComponent {
  enteredPin = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onSubmit(): void {
    const success = this.authService.login(this.enteredPin);
    
    if (success) {
      // Find the URL they originally tried to visit, or default to the main dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.router.navigateByUrl(returnUrl);
    } else {
      this.errorMessage = 'Invalid PIN code. Access denied.';
      this.enteredPin = '';
    }
  }
}