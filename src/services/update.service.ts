import { PrismaClient } from '@prisma/client';
import {
  CreateUpdateDto,
  CheckUpdateDto,
  UpdateResponse,
} from '../types';
import { versionToBuildNumber } from '../utils/licenseKey';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UpdateService {
  /**
   * Create a new update
   */
  async createUpdate(data: CreateUpdateDto) {
    // Check if version already exists
    const existing = await prisma.update.findUnique({
      where: { version: data.version },
    });

    if (existing) {
      throw new BadRequestError(`Update version ${data.version} already exists`);
    }

    const update = await prisma.update.create({
      data: {
        version: data.version,
        buildNumber: data.buildNumber,
        releaseType: data.releaseType,
        filename: data.filename,
        fileSize: BigInt(data.fileSize),
        checksum: data.checksum,
        releaseNotes: data.releaseNotes,
        forceUpdate: data.forceUpdate,
        isActive: true,
      },
    });

    logger.success(`Created update: ${data.version} (Build ${data.buildNumber})`);

    return update;
  }

  /**
   * Check for updates
   */
  async checkForUpdate(data: CheckUpdateDto): Promise<UpdateResponse> {
    const currentBuildNumber = versionToBuildNumber(data.version);

    // Find the latest active update with a higher build number
    const latestUpdate = await prisma.update.findFirst({
      where: {
        isActive: true,
        buildNumber: {
          gt: currentBuildNumber,
        },
      },
      orderBy: {
        buildNumber: 'desc',
      },
    });

    if (!latestUpdate) {
      logger.info(`No update available for version ${data.version}`);
      return {
        updateAvailable: false,
        message: 'You are running the latest version',
      };
    }

    // Record the update check
    await this.recordUpdateHistory({
      updateId: latestUpdate.id,
      userId: data.userId,
      fromVersion: data.version,
      toVersion: latestUpdate.version,
      updateType: 'manual',
      status: 'started',
      platform: data.platform,
      appVersion: data.appVersion,
    });

    logger.info(`Update available: ${data.version} → ${latestUpdate.version}`);

    return {
      updateAvailable: true,
      latestVersion: {
        version: latestUpdate.version,
        buildNumber: latestUpdate.buildNumber,
        releaseType: latestUpdate.releaseType,
        downloadUrl: `/api/v2/updates/download/${latestUpdate.version}`,
        fileSize: Number(latestUpdate.fileSize),
        checksum: latestUpdate.checksum,
        releaseNotes: latestUpdate.releaseNotes,
        forceUpdate: latestUpdate.forceUpdate,
      },
    };
  }

  /**
   * Get update by version
   */
  async getUpdateByVersion(version: string) {
    const update = await prisma.update.findUnique({
      where: { version },
    });

    if (!update) {
      throw new NotFoundError(`Update version ${version} not found`);
    }

    return update;
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(version: string) {
    await prisma.update.update({
      where: { version },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    logger.info(`Download count incremented for version ${version}`);
  }

  /**
   * Record update history
   */
  async recordUpdateHistory(data: {
    updateId: string;
    userId: string;
    fromVersion: string;
    toVersion: string;
    updateType: string;
    status: string;
    platform?: string;
    appVersion?: string;
    errorMessage?: string;
  }) {
    return await prisma.updateHistory.create({
      data,
    });
  }

  /**
   * Update history status
   */
  async updateHistoryStatus(
    userId: string,
    toVersion: string,
    status: 'completed' | 'failed',
    errorMessage?: string
  ) {
    const history = await prisma.updateHistory.findFirst({
      where: {
        userId,
        toVersion,
        status: 'started',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (history) {
      await prisma.updateHistory.update({
        where: { id: history.id },
        data: {
          status,
          errorMessage,
          completedAt: status === 'completed' ? new Date() : undefined,
        },
      });
    }
  }

  /**
   * Get all updates
   */
  async getAllUpdates(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [updates, total] = await Promise.all([
      prisma.update.findMany({
        skip,
        take: limit,
        orderBy: { buildNumber: 'desc' },
      }),
      prisma.update.count(),
    ]);

    return {
      updates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Deactivate an update
   */
  async deactivateUpdate(version: string) {
    const update = await prisma.update.update({
      where: { version },
      data: { isActive: false },
    });

    logger.warn(`Update deactivated: ${version}`);

    return update;
  }

  /**
   * Get update statistics
   */
  async getStatistics() {
    const [
      totalUpdates,
      activeUpdates,
      totalDownloads,
      recentHistory,
    ] = await Promise.all([
      prisma.update.count(),
      prisma.update.count({ where: { isActive: true } }),
      prisma.update.aggregate({
        _sum: {
          downloadCount: true,
        },
      }),
      prisma.updateHistory.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalUpdates,
      activeUpdates,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      recentHistory,
    };
  }
}

export const updateService = new UpdateService();

