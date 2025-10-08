import crypto from 'crypto';

/**
 * Generate a license key in format: MACMAN-XXXXX-XXXXX-XXXXX
 */
export function generateLicenseKey(): string {
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    const segment = crypto.randomBytes(3)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .substring(0, 5)
      .padEnd(5, '0');
    segments.push(segment);
  }
  
  return `MACMAN-${segments.join('-')}`;
}

/**
 * Validate license key format
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  const pattern = /^MACMAN-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  return pattern.test(key);
}

/**
 * Generate checksum for a file
 */
export function generateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Compare version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

/**
 * Extract build number from version string
 */
export function versionToBuildNumber(version: string): number {
  const parts = version.split('.').map(Number);
  // Convert 1.0.8 to 10008 for easy comparison
  return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

