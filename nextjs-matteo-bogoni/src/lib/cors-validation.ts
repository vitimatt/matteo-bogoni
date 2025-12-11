/**
 * CORS Header Validation Utilities
 * 
 * This module provides utilities to validate CORS header values
 * and ensure they comply with web standards and security best practices.
 */

export interface CorsHeaders {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Credentials'?: string;
  'Access-Control-Expose-Headers'?: string;
  'Access-Control-Max-Age'?: string;
}

export interface CorsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates CORS header values according to web standards
 */
export function validateCorsHeaders(headers: CorsHeaders): CorsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Access-Control-Allow-Origin
  if (headers['Access-Control-Allow-Origin']) {
    const origin = headers['Access-Control-Allow-Origin'];
    
    if (origin === '*') {
      // Check if credentials are enabled
      if (headers['Access-Control-Allow-Credentials'] === 'true') {
        errors.push('Access-Control-Allow-Origin cannot be "*" when Access-Control-Allow-Credentials is "true"');
      }
    } else if (origin !== 'null') {
      // Validate origin format
      try {
        new URL(origin);
      } catch {
        errors.push(`Invalid origin format: ${origin}. Must be a valid URL or "*"`);
      }
    }
  }

  // Validate Access-Control-Allow-Methods
  if (headers['Access-Control-Allow-Methods']) {
    const methods = headers['Access-Control-Allow-Methods']
      .split(',')
      .map(m => m.trim().toUpperCase());
    
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const invalidMethods = methods.filter(method => !validMethods.includes(method));
    
    if (invalidMethods.length > 0) {
      errors.push(`Invalid HTTP methods: ${invalidMethods.join(', ')}. Valid methods: ${validMethods.join(', ')}`);
    }

    if (!methods.includes('OPTIONS')) {
      warnings.push('Consider including OPTIONS method for preflight requests');
    }
  }

  // Validate Access-Control-Allow-Headers
  if (headers['Access-Control-Allow-Headers']) {
    const headersList = headers['Access-Control-Allow-Headers']
      .split(',')
      .map(h => h.trim());
    
    const forbiddenHeaders = ['cookie', 'authorization', 'x-api-key'];
    const hasForbiddenHeaders = headersList.some(header => 
      forbiddenHeaders.includes(header.toLowerCase())
    );
    
    if (hasForbiddenHeaders) {
      warnings.push('Sensitive headers detected. Ensure proper authentication is in place');
    }
  }

  // Validate Access-Control-Allow-Credentials
  if (headers['Access-Control-Allow-Credentials']) {
    const credentials = headers['Access-Control-Allow-Credentials'];
    if (credentials !== 'true' && credentials !== 'false') {
      errors.push('Access-Control-Allow-Credentials must be "true" or "false"');
    }
  }

  // Validate Access-Control-Max-Age
  if (headers['Access-Control-Max-Age']) {
    const maxAge = parseInt(headers['Access-Control-Max-Age']);
    if (isNaN(maxAge) || maxAge < 0) {
      errors.push('Access-Control-Max-Age must be a non-negative integer');
    } else if (maxAge > 86400) {
      warnings.push('Access-Control-Max-Age is very long (>24h). Consider shorter values for security');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Common CORS configurations for different environments
 */
export const corsConfigs = {
  development: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400'
  },
  
  production: {
    'Access-Control-Allow-Origin': 'https://yourdomain.com', // Replace with actual domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600'
  }
};

/**
 * Get environment-specific CORS headers
 */
export function getCorsHeaders(environment: 'development' | 'production', allowedOrigin?: string): CorsHeaders {
  const config = corsConfigs[environment];
  
  if (environment === 'production' && allowedOrigin) {
    return {
      ...config,
      'Access-Control-Allow-Origin': allowedOrigin
    };
  }
  
  return config;
}

/**
 * Test CORS configuration with sample requests
 */
export function testCorsConfiguration(headers: CorsHeaders): {
  simpleRequest: boolean;
  preflightRequest: boolean;
  credentialedRequest: boolean;
} {
  const result = {
    simpleRequest: false,
    preflightRequest: false,
    credentialedRequest: false
  };

  // Test simple request
  if (headers['Access-Control-Allow-Origin']) {
    result.simpleRequest = true;
  }

  // Test preflight request
  if (headers['Access-Control-Allow-Methods'] && headers['Access-Control-Allow-Headers']) {
    result.preflightRequest = true;
  }

  // Test credentialed request
  if (headers['Access-Control-Allow-Credentials'] === 'true' && 
      headers['Access-Control-Allow-Origin'] && 
      headers['Access-Control-Allow-Origin'] !== '*') {
    result.credentialedRequest = true;
  }

  return result;
}

