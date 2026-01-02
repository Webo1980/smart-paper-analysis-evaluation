// src/utils/formatters.js

/**
 * Formatting Utilities
 * 
 * Common formatting functions used across dashboard components
 */

/**
 * Format a decimal number as a percentage string
 * @param {number} value - Decimal value (0-1)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number with commas as thousands separators
 * @param {number} value - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toLocaleString('en-US');
}

/**
 * Format a date string to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a timestamp to readable datetime
 * @param {string|Date|number} timestamp - Timestamp to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid DateTime';
  }
  
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a DOI with link
 * @param {string} doi - DOI string
 * @returns {string} Formatted DOI (without URL prefix)
 */
export function formatDOI(doi) {
  if (!doi) return 'N/A';
  
  // Remove common URL prefixes
  return doi
    .replace('https://doi.org/', '')
    .replace('http://doi.org/', '')
    .replace('doi:', '')
    .trim();
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a decimal to fixed decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatDecimal(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return value.toFixed(decimals);
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }
  
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  } else {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case or camelCase to Title Case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return '';
  
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}