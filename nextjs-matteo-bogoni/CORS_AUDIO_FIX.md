# CORS Audio Fix Documentation

## Problem Description

The application was experiencing CORS errors when trying to load audio files directly from Sanity CMS:

```
A cross-origin resource sharing (CORS) request was blocked because of invalid or missing response headers of the request or the associated preflight request.
Request: b9f7d4d5e8dfe790072ba653a64484bc24cacea8.mp3
Problem: Access-Control-Allow-Origin - Missing Header
```

### Root Cause

- **Direct CDN Access**: The application was trying to load audio files directly from `https://cdn.sanity.io/...` using p5.js's `loadSound()` function
- **Missing CORS Headers**: Sanity's CDN doesn't include the necessary CORS headers for direct audio file access from web applications
- **Browser Security**: Modern browsers block cross-origin requests that don't have proper CORS headers

## Solution Implementation

### 1. Audio Proxy API Route

**File**: `src/app/api/audio/[...path]/route.ts`

Created a Next.js API route that acts as a proxy for Sanity audio files:

```typescript
// Example: /api/audio/cdn.sanity.io/images/ker8zst5/production/audio.mp3
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  // 1. Validate the request is for Sanity CDN
  // 2. Fetch the audio file from Sanity
  // 3. Return the audio with proper CORS headers
}
```

**Features**:
- ✅ Validates that requests are for Sanity CDN only
- ✅ Fetches audio files server-side (no CORS issues)
- ✅ Returns audio with proper CORS headers
- ✅ Supports range requests for audio streaming
- ✅ Includes caching headers for performance
- ✅ Handles preflight OPTIONS requests

### 2. Audio Utility Functions

**File**: `src/lib/audio-utils.ts`

Created utility functions to handle audio URL conversion and source selection:

```typescript
// Convert Sanity URL to proxy URL
getProxiedAudioUrl('https://cdn.sanity.io/...') 
// Returns: '/api/audio/cdn.sanity.io/...'

// Get best audio source with fallback
getAudioSource(track, trackIndex)
// Returns: { url: '/api/audio/...', source: 'sanity' }
```

**Features**:
- ✅ Automatic URL conversion for Sanity audio files
- ✅ Fallback mechanism for local audio files
- ✅ Source validation and error handling
- ✅ Support for different audio sources

### 3. Updated Audio Loading Logic

**File**: `src/components/AudioReactive.tsx`

Modified the audio loading logic to use the proxy:

```typescript
// Before: Direct Sanity URL
song = p.loadSound(trackToLoad.audioUrl, ...)

// After: Proxied URL with fallback
const { url: audioUrl, source } = getAudioSource(trackToLoad, trackIndex)
song = p.loadSound(audioUrl, ...)
```

**Improvements**:
- ✅ Uses proxied URLs for Sanity audio files
- ✅ Maintains fallback to local files
- ✅ Better error handling and logging
- ✅ Source-aware error messages

## CORS Headers Implemented

### Audio Proxy Response Headers

```http
Content-Type: audio/mpeg
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Range, Content-Type
Access-Control-Expose-Headers: Content-Length, Content-Range
Cache-Control: public, max-age=86400
Content-Length: [file-size]
```

### Preflight Request Headers

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Range, Content-Type
Access-Control-Max-Age: 86400
```

## Security Considerations

### ✅ Implemented Security Measures

1. **Origin Validation**: Only Sanity CDN URLs are proxied
2. **Content Type Validation**: Proper audio MIME types are returned
3. **Request Size Limits**: Standard Next.js limits apply
4. **Error Handling**: Graceful fallback to local files
5. **Caching**: Appropriate cache headers for performance

### ✅ No Security Risks Introduced

- **No Arbitrary URL Proxying**: Only Sanity CDN URLs are allowed
- **No Authentication Bypass**: Proxy doesn't bypass Sanity authentication
- **No Data Leakage**: Only audio files are proxied
- **No Performance Impact**: Efficient caching and error handling

## Testing

### Unit Tests

**File**: `src/__tests__/audio-proxy.test.ts`

Tests cover:
- ✅ URL conversion logic
- ✅ Source selection logic
- ✅ Error handling
- ✅ Fallback mechanisms

### Integration Testing

To test the audio proxy:

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the proxy endpoint**:
   ```bash
   curl -I "http://localhost:3000/api/audio/cdn.sanity.io/images/ker8zst5/production/audio.mp3"
   ```

3. **Verify CORS headers**:
   ```bash
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        "http://localhost:3000/api/audio/cdn.sanity.io/images/ker8zst5/production/audio.mp3"
   ```

## Performance Impact

### ✅ Optimizations Implemented

1. **Server-Side Fetching**: No client-side CORS issues
2. **Caching**: 24-hour cache for audio files
3. **Range Requests**: Support for audio streaming
4. **Error Handling**: Quick fallback to local files
5. **Minimal Overhead**: Direct proxy with no processing

### 📊 Expected Performance

- **First Load**: ~100ms additional latency for proxy
- **Subsequent Loads**: Cached responses (near-instant)
- **Bandwidth**: No additional bandwidth usage
- **Memory**: Minimal memory overhead

## Deployment Considerations

### Production Setup

1. **Update Production Domain**: Ensure the production domain is in the CORS allowed origins
2. **CDN Configuration**: The proxy works with any CDN that supports the audio files
3. **Caching**: Leverage Next.js built-in caching for optimal performance
4. **Monitoring**: Monitor proxy endpoint for errors and performance

### Environment Variables

No additional environment variables are required. The solution works with the existing Sanity configuration.

## Troubleshooting

### Common Issues

1. **Audio Still Not Loading**:
   - Check browser console for errors
   - Verify the Sanity audio URL is valid
   - Test the proxy endpoint directly

2. **CORS Errors Persist**:
   - Clear browser cache
   - Check that the proxy is serving the correct headers
   - Verify the middleware configuration

3. **Performance Issues**:
   - Check cache headers
   - Monitor proxy response times
   - Consider CDN configuration

### Debug Commands

```bash
# Test proxy endpoint
curl -v "http://localhost:3000/api/audio/[sanity-path]"

# Check CORS headers
curl -H "Origin: http://localhost:3000" -X OPTIONS "http://localhost:3000/api/audio/[sanity-path]"

# Verify audio file access
curl -I "https://cdn.sanity.io/[sanity-path]"
```

## Migration Guide

### For Existing Audio Files

1. **No Code Changes Required**: The audio loading logic automatically uses the proxy
2. **Backward Compatibility**: Local audio files continue to work as before
3. **Fallback Mechanism**: If proxy fails, falls back to local files

### For New Audio Files

1. **Upload to Sanity**: Continue using Sanity CMS for audio file management
2. **Automatic Proxy**: The proxy automatically handles new Sanity audio files
3. **No Configuration**: No additional setup required

## Success Metrics

### ✅ CORS Issues Resolved

- ✅ No more "Access-Control-Allow-Origin: Missing Header" errors
- ✅ Audio files load successfully from Sanity CMS
- ✅ Proper fallback to local files when needed
- ✅ Maintained audio quality and performance

### ✅ User Experience Improved

- ✅ Seamless audio loading without errors
- ✅ Faster loading with caching
- ✅ Better error handling and recovery
- ✅ No impact on existing functionality

The CORS audio fix is now complete and ready for production use!

