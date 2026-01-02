// src\components\evaluation\base\utils\uiUtils.js
/**
 * UI utility functions shared across evaluation components
 */

/**
 * Get badge color class based on score and rating scale
 * @param {number} score - The score to evaluate (0-1)
 * @param {object} [thresholds] - Optional custom score threshold configuration
 * @param {number} [thresholds.excellent=0.9] - Minimum score for excellent quality (green)
 * @param {number} [thresholds.good=0.7] - Minimum score for good quality (yellow)
 * @returns {string} Tailwind CSS classes for the badge with hover effects
 */
export const getStatusBadgeColor = (score, thresholds = {}) => {
  // Default thresholds matching the specified rating scale
  const {
    excellent = 0.9,    // ≥90% = Excellent (Green)
    good = 0.7,         // 70-89% = Good (Yellow)
  } = thresholds;

  // Validate score is between 0-1
  const normalizedScore = Math.min(Math.max(score, 0), 1);

  // Return appropriate badge classes with hover effects
  if (normalizedScore >= excellent) {
    return 'bg-green-600 hover:bg-green-700 text-white';
  }
  if (normalizedScore >= good) {
    return 'bg-yellow-500 hover:bg-yellow-600 text-black';
  }
  return 'bg-red-600 hover:bg-red-700 text-white';
};

/**
 * Format a value with appropriate units
 * @param {*} value - The value to format
 * @param {string} fieldType - Type of field for special formatting
 * @returns {string} Formatted value with units
 */
export const formatValueWithUnits = (value, fieldType = '') => {
  if (value === null || value === undefined) return 'N/A';
  
  // Special handling for percentage fields
  if (fieldType.toLowerCase().includes('percent')) {
    return `${Math.round(Number(value) * 100)}%`;
  }
  
  // Special handling for year fields
  if (fieldType.toLowerCase().includes('year')) {
    return String(value).substring(0, 4);
  }
  
  // Default numeric formatting
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return String(value);
};

/**
 * Generate a color scale for visualization
 * @param {number} value - Value between 0-1
 * @returns {string} Tailwind CSS color class
 */
export const getColorScale = (value) => {
  const hue = Math.round(120 * value); // 0 (red) to 120 (green)
  return `hsl(${hue}, 100%, 40%)`;
};

/**
 * Calculate width for progress bars
 * @param {number} value - Value between 0-1
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {object} Style object with width
 */
export const getProgressWidth = (value, maxWidth = 200) => {
  const width = Math.max(0, Math.min(1, value)) * maxWidth;
  return { width: `${width}px` };
};

export const getStatusBackground = (status, statusColors = {
  good: 'bg-green-50',
  medium: 'bg-yellow-50',
  poor: 'bg-red-50'
}) => {
  return statusColors[status] || 'bg-gray-50';
};

/**
 * Get highlight color class based on status
 * @param {string} status - Status ('good', 'medium', 'poor')
 * @param {object} highlightColors - Custom highlight colors
 * @returns {string} Tailwind CSS classes for highlight
 */
export const getStatusHighlight = (status, highlightColors = {
  good: 'ring-green-200 bg-green-50',
  medium: 'ring-yellow-200 bg-yellow-50',
  poor: 'ring-red-200 bg-red-50'
}) => {
  return highlightColors[status] || 'ring-gray-200 bg-gray-50';
};