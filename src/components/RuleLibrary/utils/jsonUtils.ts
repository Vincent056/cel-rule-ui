/**
 * Utility functions for handling JSON data in test cases
 */

/**
 * Safely parse JSON, returning the parsed object or null if invalid
 */
export function safeJsonParse(jsonString: string): any | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Format JSON string with proper indentation
 */
export function formatJson(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return '{}';
  }
}

/**
 * Auto-escape JSON if it's not already properly escaped
 * This handles common cases where users paste unescaped JSON
 */
export function autoEscapeJson(input: string): string {
  const trimmed = input.trim();
  
  // If it's already valid JSON, return as-is
  if (safeJsonParse(trimmed) !== null) {
    return trimmed;
  }
  
  // Try to fix common JSON issues
  let fixed = trimmed;
  
  // Add missing quotes around property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // Add missing quotes around string values (simple heuristic)
  fixed = fixed.replace(/:(\s*)([^",{\[\]\s}][^",{\[\]}]*?)(\s*[,}])/g, ': "$2"$3');
  
  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');
  
  // Ensure proper object wrapping
  if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
    fixed = `{${fixed}}`;
  }
  
  // Validate the fixed version
  if (safeJsonParse(fixed) !== null) {
    return formatJson(safeJsonParse(fixed));
  }
  
  // If all fixes fail, return a basic object with the original as a string value
  try {
    return formatJson({ rawInput: input });
  } catch {
    return '{}';
  }
}

/**
 * Validate if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  return safeJsonParse(str) !== null;
}

/**
 * Get a user-friendly error message for JSON parsing errors
 */
export function getJsonErrorMessage(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return '';
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `JSON Error: ${error.message}`;
    }
    return 'Invalid JSON format';
  }
}
