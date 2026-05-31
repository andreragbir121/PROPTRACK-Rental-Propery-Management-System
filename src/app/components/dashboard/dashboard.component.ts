import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core'; 
import { isPlatformBrowser } from '@angular/common'; 
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
  @ViewChild('expenseCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  data: any;
  loading = true;
  error: string | null = null;
  
  private rawExpensesList: any[] = [];
  private isBrowser: boolean;

  constructor(
    private propertyService: PropertyService,
    private tenantService: TenantService,
    private paymentService: PaymentService,
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    // Determine if we are on Vercel's server runtime or a client browser window
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
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

        this.rawExpensesList = safeExpenses;

        const totalRent = safePayments
          .filter(p => p && p.status === 'Paid')
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const totalExpenses = safeExpenses
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          
        const netIncome = totalRent - totalExpenses;

        const occupied = safeProperties.filter(p => p && p.status === 'Occupied').length;
        const totalProperties = safeProperties.length;

        const activeTenants = safeTenants.filter(t => {
          if (!t || !t.leaseEnd) return false;
          return new Date(t.leaseEnd) > new Date();
        }).length;

        const recentPayments = [...safePayments]
          .filter(p => p && p.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        this.data = {
          totalRent,
          totalExpenses,
          netIncome,
          occupied,
          totalProperties,
          activeTenants,
          recentPayments
        };
        
        this.loading = false;
        this.cdr.detectChanges();

        if (this.isBrowser && this.canvasRef) {
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

  ngAfterViewInit(): void {
    if (this.isBrowser && this.rawExpensesList.length > 0) {
      this.renderBarChart();
    }
  }

  renderBarChart(): void {
    if (!this.isBrowser || !this.canvasRef) return; 
    
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalsMap: { [key: string]: number } = {};
    this.rawExpensesList.forEach(e => {
      const typeLabel = e.type || e.category || 'Other';
      totalsMap[typeLabel] = (totalsMap[typeLabel] || 0) + (Number(e.amount || e.cost) || 0);
    });

    const labels = Object.keys(totalsMap);
    const dataValues = Object.values(totalsMap);

    const paddingLeftRight = 50;
    const paddingTopBottom = 40;
    const chartHeight = canvas.height - (paddingTopBottom * 2);
    const chartWidth = canvas.width - (paddingLeftRight * 2);
    
    const maxVal = Math.max(...dataValues, 100);
    const barWidth = (chartWidth / labels.length) - 20;

    labels.forEach((label, index) => {
      const val = dataValues[index];
      const barHeight = (val / maxVal) * chartHeight;
      
      const x = paddingLeftRight + (index * (chartWidth / labels.length)) + 10;
      const y = canvas.height - paddingTopBottom - barHeight;

      ctx.fillStyle = '#6f42c1'; 
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillText(`$${val}`, x + (barWidth / 2), y - 8);
    });

    ctx.beginPath();
    ctx.moveTo(paddingLeftRight, canvas.height - paddingTopBottom);
    ctx.lineTo(canvas.width - paddingLeftRight, canvas.height - paddingTopBottom);
    ctx.stroke();
  }
}