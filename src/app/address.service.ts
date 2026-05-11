import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/address';

  getEmployeeByMoreThanOneAddress(count: number): Observable<EmployeeAddressResult[]> {
    return this.http.get<EmployeeAddressResult[]>(`${this.apiUrl}/${count}`);
  }
}

export interface Address {
  id?: string;
  city?: string;
  pincode?: string;
  address?: string;
  phoneNumber?: string;
  employeeID?: string;
}

export interface EmployeeAddressResult {
  id: number;
  name: string;
  email: string;
  addresses?: Address[] | null;
}
