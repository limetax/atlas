/**
 * Validation Utilities
 */

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;

    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;

    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true; // If we can't parse it, consider it invalid
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const isValidPdfFile = (file: File): boolean => {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    return false;
  }
  return true;
};
