import { Request } from 'express';

// Extend Express Request with custom properties
export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
  userId?: string;
}

// License Types
export interface CreateLicenseDto {
  email?: string;
  plan: 'Individual' | '2 Devices' | '5 Devices' | 'Enterprise';
  maxDevices?: number;
}

export interface ValidateLicenseDto {
  licenseKey: string;
  machineId: string;
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface LicenseResponse {
  valid: boolean;
  message: string;
  data?: {
    licenseKey: string;
    plan: string;
    maxDevices: number;
    deviceCount: number;
    isActive: boolean;
  };
  errorType?: 'invalid_key' | 'machine_mismatch' | 'max_devices_reached' | 'inactive' | 'expired';
  purchaseUrl?: string;
}

// Update Types
export interface CreateUpdateDto {
  version: string;
  buildNumber: number;
  releaseType: 'normal' | 'forced' | 'beta';
  filename: string;
  fileSize: number;
  checksum: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

export interface CheckUpdateDto {
  version: string;
  platform: string;
  userId: string;
  appVersion?: string;
}

export interface UpdateResponse {
  updateAvailable: boolean;
  latestVersion?: {
    version: string;
    buildNumber: number;
    releaseType: string;
    downloadUrl: string;
    fileSize: number;
    checksum: string;
    releaseNotes: string;
    forceUpdate: boolean;
  };
  message?: string;
}

// Payment Types
export interface CreatePaymentDto {
  email: string;
  amount: number;
  currency: string;
  provider: string;
  transactionId: string;
  plan: string;
  metadata?: Record<string, any>;
}

// Analytics Types
export interface TrackEventDto {
  eventType: string;
  userId?: string;
  metadata?: Record<string, any>;
  platform?: string;
  appVersion?: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Admin Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateAdminDto {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'super_admin';
}

