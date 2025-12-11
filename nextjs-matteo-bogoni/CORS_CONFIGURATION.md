# CORS Configuration Documentation

This document outlines the Cross-Origin Resource Sharing (CORS) configuration implemented in the Matteo Bogoni Next.js application to ensure secure and compliant cross-origin requests.

## Overview

CORS is a security feature that controls how web pages can access resources from different domains. Our application implements a comprehensive CORS strategy that:

- Allows legitimate cross-origin requests from trusted sources
- Prevents unauthorized access from malicious origins
- Complies with web security standards
- Supports both development and production environments

## Implementation

### 1. Middleware Configuration (`src/middleware.ts`)

The primary CORS handling is implemented through Next.js middleware that:

- **Validates Origins**: Checks incoming requests against a whitelist of allowed origins
- **Sets Headers**: Applies appropriate CORS headers based on the request origin
- **Handles Preflight**: Responds correctly to OPTIONS preflight requests
- **Manages Credentials**: Properly handles credentialed requests

#### Key Features:

```typescript
// Allowed origins for cross-origin requests
const allowedOrigins = [
  'http://localhost:3000',           // Development server
  'http://localhost:3333',           // Sanity Studio
  'https://matteo-bogoni.vercel.app', // Production domain
  'https://cdn.sanity.io',           // Sanity CDN
  'https://cdnjs.cloudflare.com',    // p5.js CDN
];
```

#### CORS Headers Set:

- `Access-Control-Allow-Origin`: Specific origin or wildcard (when no credentials)
- `Access-Control-Allow-Credentials`: `true` for trusted origins
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers`: Essential headers for API communication
- `Access-Control-Expose-Headers`: Headers clients can access
- `Access-Control-Max-Age`: Cache duration for preflight requests (24 hours)

### 2. Next.js Configuration (`next.config.js`)

Additional security headers and API-specific CORS rules:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // Security headers
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        // API-specific CORS headers
        { key: 'Access-Control-Allow-Origin', value: 'production-origin' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

### 3. Validation Utilities (`src/lib/cors-validation.ts`)

Comprehensive validation functions that ensure CORS headers comply with standards:

- **Header Validation**: Checks format and values of CORS headers
- **Security Checks**: Validates combinations of headers (e.g., credentials with wildcard origins)
- **Environment Configs**: Provides pre-configured headers for different environments
- **Testing Utilities**: Functions to test CORS configuration scenarios

## Security Considerations

### 1. Origin Validation

- **Whitelist Approach**: Only explicitly allowed origins can make cross-origin requests
- **No Wildcard with Credentials**: Prevents security vulnerabilities when using credentials
- **Environment-Specific**: Different rules for development vs. production

### 2. Header Restrictions

- **Limited Methods**: Only necessary HTTP methods are allowed
- **Controlled Headers**: Specific headers are whitelisted for requests
- **Sensitive Data Protection**: Warnings for potentially sensitive headers

### 3. Credential Handling

- **Secure by Default**: Credentials are only allowed for trusted origins
- **Explicit Configuration**: Clear separation between credentialed and non-credentialed requests

## Testing

### Unit Tests (`src/__tests__/cors.test.ts`)

Comprehensive test suite covering:

- Header validation logic
- Security constraint enforcement
- Environment-specific configurations
- Edge cases and error conditions

### Test Scenarios

1. **Simple Requests**: Basic GET requests with proper origin headers
2. **Preflight Requests**: OPTIONS requests with complex headers/methods
3. **Credentialed Requests**: Requests with authentication cookies/headers
4. **Invalid Configurations**: Tests for common misconfigurations

## Common Issues and Solutions

### Issue: CORS Error in Browser Console

**Solution**: Check that the requesting origin is in the `allowedOrigins` list in `middleware.ts`

### Issue: Credentials Not Working

**Solution**: Ensure `Access-Control-Allow-Origin` is not set to `*` when using credentials

### Issue: Preflight Request Failing

**Solution**: Verify that OPTIONS method is included in `Access-Control-Allow-Methods`

### Issue: Custom Headers Blocked

**Solution**: Add the header name to `Access-Control-Allow-Headers`

## Environment-Specific Configuration

### Development
- More permissive CORS settings
- Wildcard origins allowed (without credentials)
- Longer cache times for convenience

### Production
- Strict origin validation
- Specific domains only
- Shorter cache times for security

## Monitoring and Maintenance

### Regular Checks
- Monitor browser console for CORS errors
- Review allowed origins list quarterly
- Update security headers as needed
- Test CORS configuration after deployments

### Adding New Origins
1. Add the origin to `allowedOrigins` in `middleware.ts`
2. Update production domain in `next.config.js` if needed
3. Test the configuration
4. Update documentation

## External Dependencies

The application makes requests to:
- **Sanity CMS**: `https://cdn.sanity.io` (for content and media)
- **p5.js CDN**: `https://cdnjs.cloudflare.com` (for JavaScript libraries)

These origins are properly configured in the CORS middleware to ensure smooth operation.

## Compliance

This CORS configuration complies with:
- W3C CORS specification
- OWASP security guidelines
- Next.js best practices
- Modern browser security requirements

## Troubleshooting

For CORS-related issues:

1. Check browser developer tools network tab for CORS errors
2. Verify the requesting origin is in the allowed list
3. Ensure headers are properly formatted
4. Test with the validation utilities in `src/lib/cors-validation.ts`
5. Run the test suite to verify configuration

For additional support, refer to the Mozilla CORS documentation or Next.js middleware documentation.

