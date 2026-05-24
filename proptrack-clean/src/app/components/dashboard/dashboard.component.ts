import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core'; 
import { forkJoin } from 'rxjs';
import { PropertyService } from '../../services/property.service';
import { TenantService } from '../../services/tenant.service';
import { PaymentService } from '../../services/payment.service';
import { ExpenseService } from '../../services/expense.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,                          
  imports: [CommonModule],                  
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  // Direct hook anchor pointing to the HTML view canvas element
  @ViewChild('expenseCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Application-level component state variables
  data: any;
  loading = true;
  error: string | null = null;
  
  // Internal cache to hold parsed backend logs for chart rendering routines
  private rawExpensesList: any[] = [];

  constructor(
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private paymentService: PaymentService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // RxJS forkJoin executes multiple backend API HTTP requests concurrently 
    forkJoin({
      properties: this.propertyService.getAll(),
      tenants: this.tenantService.getAll(),
      payments: this.paymentService.getAll(),
      expenses: this.expenseService.getAll()
    }).subscribe({
      next: ({ properties, tenants, payments, expenses }) => {

        const safePayments = payments || [];
        const safeExpenses = expenses || [];
        const safeProperties = properties || [];
        const safeTenants = tenants || [];

        // Cache the safe expense logs array globally for canvas parsing access
        this.rawExpensesList = safeExpenses;

        // Calculate total revenue derived from completed 'Paid' statuses
        const totalRent = safePayments
          .filter(p => p && p.status === 'Paid')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Sum up total expenditures logged in the system
        const totalExpenses = safeExpenses
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        // Determine true net operational financial standing
        const netIncome = totalRent - totalExpenses;

        // Extract occupancy percentages using database properties array 
        const occupied = safeProperties.filter(p => p && p.status === 'Occupied').length;
        const totalProperties = safeProperties.length;

        // Filter active tenants by validating lease boundaries against current time
        const activeTenants = safeTenants.filter(t => {
          if (!t || !t.leaseEnd) return false;
          return new Date(t.leaseEnd) > new Date();
        }).length;

        const recentPayments = [...safePayments]
          .filter(p => p && p.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        // Hydrate state payload with structural aggregations for template binding
        this.data = {
          totalRent,
          totalExpenses,
          netIncome,
          occupied,
          totalProperties,
          activeTenants,
          recentPayments
        };
        
        // Deactivate loading animation layout state
        this.loading = false;
        
        // Force view updates layout updates explicitly
        this.cdr.detectChanges();

        // If data finishes loading late and canvas reference is ready, execute graph paint immediately
        if (this.canvasRef) {
          this.renderBarChart();
        }
      },
      
      error: (err) => {
        console.error("Dashboard failed to initialize: ", err);
        this.error = 'Unable to connect to service database layers.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Ensures view canvas reference mappings hook up securely on view load iterations
  ngAfterViewInit(): void {
    if (this.rawExpensesList.length > 0) {
      this.renderBarChart();
    }
  }

  renderBarChart(): void {
    if (!this.canvasRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //Group expense metrics dynamically by type keys
    const totalsMap: { [key: string]: number } = {};
    this.rawExpensesList.forEach(e => {
      //handle matching variations of type or category keys
      const typeLabel = e.type || e.category || 'Other';
      totalsMap[typeLabel] = (totalsMap[typeLabel] || 0) + (Number(e.amount || e.cost) || 0);
    });

    const labels = Object.keys(totalsMap);
    const dataValues = Object.values(totalsMap);


    //Compute Layout Boundary Offsets
    const paddingLeftRight = 50;
    const paddingTopBottom = 40;
    const chartHeight = canvas.height - (paddingTopBottom * 2);
    const chartWidth = canvas.width - (paddingLeftRight * 2);
    
    // Set baseline target maximum range ceiling rule dynamically
    const maxVal = Math.max(...dataValues, 100);
    const barWidth = (chartWidth / labels.length) - 20;

    // Render bars and metrics labels
    labels.forEach((label, index) => {
      const val = dataValues[index];
      const barHeight = (val / maxVal) * chartHeight;
      
      const x = paddingLeftRight + (index * (chartWidth / labels.length)) + 10;
      const y = canvas.height - paddingTopBottom - barHeight;

      // Draw structural bar shapes
      ctx.fillStyle = '#6f42c1'; // Assignment matching purple accents
      ctx.fillRect(x, y, barWidth, barHeight);

      // Render currency metric text strings above individual columns
      ctx.fillText(`$${val}`, x + (barWidth / 2), y - 8);
    });

    // 4. Draw base axis line indicator border limits
    ctx.beginPath();
    ctx.moveTo(paddingLeftRight, canvas.height - paddingTopBottom);
    ctx.lineTo(canvas.width - paddingLeftRight, canvas.height - paddingTopBottom);
    ctx.stroke();
  }
}