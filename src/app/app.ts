import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/employees';

  protected readonly status = signal('Ready');
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly employee = signal<EmployeeWithAddress | null>(null);
  protected readonly addressCount = computed(() => this.employee()?.addresses?.length ?? 0);

  protected employeeForm: EmployeePayload = {
    id: null,
    name: '',
    email: '',
    addresses: {
      city: '',
      pincode: '',
      address: '',
      phoneNumber: ''
    }
  };

  protected lookupId: number | null = null;

  protected saveEmployee(): void {
    this.request('post', `${this.apiUrl}/save`, this.employeeForm, 'Employee saved');
  }

  protected updateEmployee(): void {
    this.request('put', `${this.apiUrl}/update`, this.employeeForm, 'Employee updated');
  }

  protected findEmployee(): void {
    if (!this.lookupId) {
      this.error.set('Enter an employee id to search.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.http.get<EmployeeWithAddress>(`${this.apiUrl}/${this.lookupId}/with-addresses`).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.status.set(`Loaded employee ${employee.id}`);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Employee not found or the API is unavailable.');
        this.loading.set(false);
      }
    });
  }

  protected loadIntoForm(): void {
    const employee = this.employee();
    if (!employee) {
      return;
    }

    this.employeeForm = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      addresses: employee.addresses?.[0] ?? {
        city: '',
        pincode: '',
        address: '',
        phoneNumber: ''
      }
    };
  }

  protected resetForm(): void {
    this.employeeForm = {
      id: null,
      name: '',
      email: '',
      addresses: {
        city: '',
        pincode: '',
        address: '',
        phoneNumber: ''
      }
    };
    this.error.set('');
    this.status.set('Ready');
  }

  private request(
    method: 'post' | 'put',
    url: string,
    payload: EmployeePayload,
    successMessage: string
  ): void {
    this.loading.set(true);
    this.error.set('');

    const request =
      method === 'post'
        ? this.http.post<EmployeePayload>(url, payload)
        : this.http.put<EmployeePayload>(url, payload);

    request.subscribe({
      next: (saved) => {
        this.employeeForm = { ...this.employeeForm, id: saved.id ?? this.employeeForm.id };
        this.lookupId = saved.id ?? this.lookupId;
        this.status.set(successMessage);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Save failed. Check that the Employee API and Address API are running.');
        this.loading.set(false);
      }
    });
  }
}

interface Address {
  id?: string;
  city: string;
  pincode: string;
  address: string;
  phoneNumber: string;
  employeeID?: string;
}

interface EmployeePayload {
  id: number | null;
  name: string;
  email: string;
  addresses: Address;
}

interface EmployeeWithAddress {
  id: number;
  name: string;
  email: string;
  addresses: Address[];
}
