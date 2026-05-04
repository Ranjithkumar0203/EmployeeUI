import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddressService, EmployeeAddressResult } from './address.service';
import { EmployeePayload, EmployeeService, EmployeeWithAddress } from './employee.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly addressService = inject(AddressService);
  private readonly employeeService = inject(EmployeeService);

  protected readonly status = signal('Ready');
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly employee = signal<EmployeeWithAddress | null>(null);
  protected readonly employeeByAddressCount = signal<EmployeeAddressResult | null>(null);
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
  protected minimumAddressCount = 1;

  protected saveEmployee(): void {
    this.request(this.employeeService.saveEmployee(this.employeeForm), 'Employee saved');
  }

  protected updateEmployee(): void {
    this.request(this.employeeService.updateEmployee(this.employeeForm), 'Employee updated');
  }

  protected findEmployee(): void {
    if (!this.lookupId) {
      this.error.set('Enter an employee id to search.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.employeeService.getEmployeeWithAddresses(this.lookupId).subscribe({
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

  protected findEmployeeByAddressCount(): void {
    if (!this.minimumAddressCount || this.minimumAddressCount < 1) {
      this.error.set('Enter an address count greater than zero.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.addressService.getEmployeeByMoreThanOneAddress(this.minimumAddressCount).subscribe({
      next: (employee) => {
        this.employeeByAddressCount.set(employee);
        this.status.set(`Loaded employee with more than ${this.minimumAddressCount} address`);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No employee found for that address count, or the Address API is unavailable.');
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

  private request(request: ReturnType<EmployeeService['saveEmployee']>, successMessage: string): void {
    this.loading.set(true);
    this.error.set('');

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
