import { PrismaClient } from '@prisma/client';
import {
  CreateLicenseDto,
  ValidateLicenseDto,
  LicenseResponse,
} from '../types';
import { generateLicenseKey, isValidLicenseKeyFormat } from '../utils/licenseKey';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class LicenseService {
  /**
   * Create a new license
   */
  async createLicense(data: CreateLicenseDto) {
    const licenseKey = generateLicenseKey();
    
    const maxDevices = data.maxDevices || this.getMaxDevicesForPlan(data.plan);
    
    const license = await prisma.license.create({
      data: {
        licenseKey,
        email: data.email,
        plan: data.plan,
        maxDevices,
        isActive: true,
      },
    });
    
    logger.success(`Created license: ${licenseKey} for plan: ${data.plan}`);
    
    return license;
  }

  /**
   * Validate a license key and activate it for a machine
   */
  async validateLicense(data: ValidateLicenseDto): Promise<LicenseResponse> {
    // Validate format first
    if (!isValidLicenseKeyFormat(data.licenseKey)) {
      return {
        valid: false,
        message: 'Invalid license key format',
        errorType: 'invalid_key',
      };
    }

    // Find license
    const license = await prisma.license.findUnique({
      where: { licenseKey: data.licenseKey },
      include: {
        activations: {
          where: { isActive: true },
        },
      },
    });

    if (!license) {
      return {
        valid: false,
        message: 'License key not found',
        errorType: 'invalid_key',
      };
    }

    // Check if license is active
    if (!license.isActive) {
      return {
        valid: false,
        message: 'This license has been deactivated',
        errorType: 'inactive',
      };
    }

    // Check if license expired (for future subscription support)
    if (license.expiresAt && license.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'This license has expired',
        errorType: 'expired',
      };
    }

    // Check if this machine is already activated
    const existingActivation = license.activations.find(
      a => a.machineId === data.machineId && a.isActive
    );

    if (existingActivation) {
      // Update last seen
      await prisma.licenseActivation.update({
        where: { id: existingActivation.id },
        data: {
          lastSeenAt: new Date(),
          osVersion: data.osVersion,
          appVersion: data.appVersion,
        },
      });

      logger.info(`License validated for existing machine: ${data.machineId}`);

      return {
        valid: true,
        message: 'License validated successfully',
        data: {
          licenseKey: license.licenseKey,
          plan: license.plan,
          maxDevices: license.maxDevices,
          deviceCount: license.activations.length,
          isActive: license.isActive,
        },
      };
    }

    // Check if max devices reached
    const activeDeviceCount = license.activations.filter(a => a.isActive).length;
    if (activeDeviceCount >= license.maxDevices) {
      return {
        valid: false,
        message: `Maximum number of devices (${license.maxDevices}) reached for this license`,
        errorType: 'max_devices_reached',
        purchaseUrl: 'https://macman.dev/#pricing',
      };
    }

    // Create new activation
    await prisma.licenseActivation.create({
      data: {
        licenseId: license.id,
        machineId: data.machineId,
        deviceName: data.deviceName,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
        isActive: true,
      },
    });

    // Update license activation timestamp
    await prisma.license.update({
      where: { id: license.id },
      data: {
        activatedAt: new Date(),
        deviceCount: activeDeviceCount + 1,
      },
    });

    logger.success(`New device activated for license: ${data.licenseKey}`);

    return {
      valid: true,
      message: 'License activated successfully',
      data: {
        licenseKey: license.licenseKey,
        plan: license.plan,
        maxDevices: license.maxDevices,
        deviceCount: activeDeviceCount + 1,
        isActive: license.isActive,
      },
    };
  }

  /**
   * Get license information
   */
  async getLicenseInfo(licenseKey: string) {
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        activations: {
          where: { isActive: true },
          orderBy: { activatedAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    return license;
  }

  /**
   * Deactivate a license
   */
  async deactivateLicense(licenseKey: string) {
    const license = await prisma.license.update({
      where: { licenseKey },
      data: { isActive: false },
    });

    logger.warn(`License deactivated: ${licenseKey}`);

    return license;
  }

  /**
   * Deactivate a specific device
   */
  async deactivateDevice(licenseKey: string, machineId: string) {
    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: { activations: true },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    const activation = license.activations.find(
      a => a.machineId === machineId && a.isActive
    );

    if (!activation) {
      throw new NotFoundError('Device activation not found');
    }

    await prisma.licenseActivation.update({
      where: { id: activation.id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    // Update device count
    await prisma.license.update({
      where: { id: license.id },
      data: {
        deviceCount: license.deviceCount - 1,
      },
    });

    logger.info(`Device deactivated: ${machineId} from license: ${licenseKey}`);

    return { success: true };
  }

  /**
   * Get all licenses with pagination
   */
  async getAllLicenses(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activations: {
            where: { isActive: true },
          },
          payments: true,
        },
      }),
      prisma.license.count(),
    ]);

    return {
      licenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const [
      totalLicenses,
      activeLicenses,
      totalActivations,
      licensesByPlan,
    ] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { isActive: true } }),
      prisma.licenseActivation.count({ where: { isActive: true } }),
      prisma.license.groupBy({
        by: ['plan'],
        _count: true,
      }),
    ]);

    return {
      totalLicenses,
      activeLicenses,
      totalActivations,
      licensesByPlan,
    };
  }

  /**
   * Helper: Get max devices for a plan
   */
  private getMaxDevicesForPlan(plan: string): number {
    const planMap: Record<string, number> = {
      'Individual': 1,
      '2 Devices': 2,
      '5 Devices': 5,
      'Enterprise': 999,
    };

    return planMap[plan] || 1;
  }
}

export const licenseService = new LicenseService();

