export interface RentPayment {
  id: number;
  propertyId: number;
  tenantId: number;
  amount: number;
  date: string;
  status: PaymentStatus;
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Late = 'Late'
}
