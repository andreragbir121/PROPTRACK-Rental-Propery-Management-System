export enum ExpenseType {
  Maintenance = 'Maintenance',
  Repair = 'Repair',
  Renovation = 'Renovation'
}

export interface Expense {
  id: number;
  propertyId: number;
  description: string;
  amount: number;
  date: string;
  type: ExpenseType | string;
}
