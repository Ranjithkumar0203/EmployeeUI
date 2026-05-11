import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EmployeeAddress {
  id?: string;
  city: string;
  pincode: string;
  address: string;
  phoneNumber: string;
  employeeID?: string;
}

export interface EmployeeWorkLocation {
  id?: number | null;
  locationName: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  employeeId?: string;
}

export interface EmployeePayload {
  id: number | null;
  name: string;
  email: string;
  addresses: EmployeeAddress;
  workLocation: EmployeeWorkLocation;
}

export interface EmployeeWithAddress {
  id: number;
  name: string;
  email: string;
  addresses: EmployeeAddress[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/employees';

  saveEmployee(employee: EmployeePayload): Observable<EmployeePayload> {
    return this.http.post<EmployeePayload>(`${this.apiUrl}/save`, employee);
  }

  updateEmployee(employee: EmployeePayload): Observable<EmployeePayload> {
    return this.http.put<EmployeePayload>(`${this.apiUrl}/update`, employee);
  }

  getEmployeeWithAddresses(id: number): Observable<EmployeeWithAddress> {
    return this.http.get<EmployeeWithAddress>(`${this.apiUrl}/${id}/with-addresses`);
  }
}
