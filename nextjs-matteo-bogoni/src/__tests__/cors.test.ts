/**
 * CORS Configuration Tests
 * 
 * These tests validate that our CORS headers are properly configured
 * and comply with web standards.
 */

import { validateCorsHeaders, getCorsHeaders, testCorsConfiguration } from '../lib/cors-validation';

describe('CORS Validation', () => {
  describe('validateCorsHeaders', () => {
    it('should validate correct CORS headers', () => {
      const validHeaders = {
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600'
      };

      const result = validateCorsHeaders(validHeaders);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject wildcard origin with credentials', () => {
      const invalidHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      };

      const result = validateCorsHeaders(invalidHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Access-Control-Allow-Origin cannot be "*" when Access-Control-Allow-Credentials is "true"'
      );
    });

    it('should validate origin format', () => {
      const invalidHeaders = {
        'Access-Control-Allow-Origin': 'invalid-origin'
      };

      const result = validateCorsHeaders(invalidHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid origin format: invalid-origin. Must be a valid URL or "*"'
      );
    });

    it('should validate HTTP methods', () => {
      const invalidHeaders = {
        'Access-Control-Allow-Methods': 'GET, POST, INVALID_METHOD'
      };

      const result = validateCorsHeaders(invalidHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid HTTP methods: INVALID_METHOD. Valid methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS'
      );
    });

    it('should validate credentials value', () => {
      const invalidHeaders = {
        'Access-Control-Allow-Credentials': 'maybe'
      };

      const result = validateCorsHeaders(invalidHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Access-Control-Allow-Credentials must be "true" or "false"'
      );
    });

    it('should validate max-age value', () => {
      const invalidHeaders = {
        'Access-Control-Max-Age': 'invalid'
      };

      const result = validateCorsHeaders(invalidHeaders);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Access-Control-Max-Age must be a non-negative integer'
      );
    });

    it('should warn about long max-age', () => {
      const headersWithLongMaxAge = {
        'Access-Control-Max-Age': '172800' // 48 hours
      };

      const result = validateCorsHeaders(headersWithLongMaxAge);
      expect(result.warnings).toContain(
        'Access-Control-Max-Age is very long (>24h). Consider shorter values for security'
      );
    });

    it('should warn about missing OPTIONS method', () => {
      const headersWithoutOptions = {
        'Access-Control-Allow-Methods': 'GET, POST'
      };

      const result = validateCorsHeaders(headersWithoutOptions);
      expect(result.warnings).toContain(
        'Consider including OPTIONS method for preflight requests'
      );
    });
  });

  describe('getCorsHeaders', () => {
    it('should return development headers', () => {
      const headers = getCorsHeaders('development');
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Credentials']).toBe('false');
    });

    it('should return production headers', () => {
      const headers = getCorsHeaders('production');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://yourdomain.com');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should use custom origin for production', () => {
      const customOrigin = 'https://myapp.com';
      const headers = getCorsHeaders('production', customOrigin);
      expect(headers['Access-Control-Allow-Origin']).toBe(customOrigin);
    });
  });

  describe('testCorsConfiguration', () => {
    it('should detect simple request support', () => {
      const headers = {
        'Access-Control-Allow-Origin': 'https://example.com'
      };

      const result = testCorsConfiguration(headers);
      expect(result.simpleRequest).toBe(true);
      expect(result.preflightRequest).toBe(false);
      expect(result.credentialedRequest).toBe(false);
    });

    it('should detect preflight request support', () => {
      const headers = {
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      const result = testCorsConfiguration(headers);
      expect(result.simpleRequest).toBe(true);
      expect(result.preflightRequest).toBe(true);
      expect(result.credentialedRequest).toBe(false);
    });

    it('should detect credentialed request support', () => {
      const headers = {
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      const result = testCorsConfiguration(headers);
      expect(result.simpleRequest).toBe(true);
      expect(result.preflightRequest).toBe(true);
      expect(result.credentialedRequest).toBe(true);
    });

    it('should not support credentialed requests with wildcard origin', () => {
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      };

      const result = testCorsConfiguration(headers);
      expect(result.credentialedRequest).toBe(false);
    });
  });
});

// Integration test for middleware
describe('CORS Middleware Integration', () => {
  it('should handle preflight requests correctly', () => {
    // This would be tested with actual HTTP requests in a real test environment
    const mockHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };

    const validation = validateCorsHeaders(mockHeaders);
    expect(validation.isValid).toBe(true);

    const testResult = testCorsConfiguration(mockHeaders);
    expect(testResult.simpleRequest).toBe(true);
    expect(testResult.preflightRequest).toBe(true);
    expect(testResult.credentialedRequest).toBe(true);
  });
});

