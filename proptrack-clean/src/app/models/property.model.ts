export enum PropertyStatus { Occupied = 'Occupied', Vacant = 'Vacant' }

export interface Property {
  id: number;
  name: string;
  address: string;
  monthlyRent: number;
  status: PropertyStatus;
  description?: string;
}
