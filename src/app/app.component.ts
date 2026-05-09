import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddressService, EmployeeAddressResult } from './address.service';
import { EmployeePayload, EmployeeService, EmployeeWithAddress } from './employee.service';

interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly addressService = inject(AddressService);
  private readonly employeeService = inject(EmployeeService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly status = signal('Ready');
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly employee = signal<EmployeeWithAddress | null>(null);
  protected readonly employeeByAddressCount = signal<EmployeeAddressResult[]>([]);
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
    },
    workLocation: {
      id: null,
      locationName: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
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
      error: (error: unknown) => {
        this.handleRequestError(error, 'Employee not found or the API is unavailable.');
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
      error: (error: unknown) => {
        this.handleRequestError(
          error,
          'No employee found for that address count, or the Address API is unavailable.'
        );
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
      },
      workLocation: this.employeeForm.workLocation
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
      },
      workLocation: {
        id: null,
        locationName: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
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
      error: (error: unknown) => {
        this.handleRequestError(
          error,
          'Save failed. Check that the Employee API and Address API are running.'
        );
        this.loading.set(false);
      }
    });
  }

  private handleRequestError(error: unknown, fallbackMessage: string): void {
    const message = this.getErrorMessage(error, fallbackMessage);
    this.error.set(message);
    this.showToast(message, 'error-toast');
  }

  private showToast(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass
    });
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to connect to the API. Please check that the service is running.';
      }

      const apiError = error.error as ApiErrorResponse | string | null;

      if (typeof apiError === 'string') {
        return apiError.trim() || fallbackMessage;
      }

      if (apiError?.message?.trim()) {
        return apiError.message;
      }

      if (apiError?.error?.trim()) {
        return apiError.error;
      }
    }

    return fallbackMessage;
  }
}
