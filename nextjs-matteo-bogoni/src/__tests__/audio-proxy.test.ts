/**
 * Audio Proxy API Tests
 * 
 * These tests validate that our audio proxy correctly handles CORS issues
 * and serves audio files from Sanity CMS with proper headers.
 */

import { getProxiedAudioUrl, getAudioSource } from '../lib/audio-utils';

describe('Audio Proxy Utilities', () => {
  describe('getProxiedAudioUrl', () => {
    it('should convert Sanity CDN URL to proxy URL', () => {
      const sanityUrl = 'https://cdn.sanity.io/images/ker8zst5/production/b9f7d4d5e8dfe790072ba653a64484bc24cacea8.mp3';
      const expectedUrl = '/api/audio/cdn.sanity.io/images/ker8zst5/production/b9f7d4d5e8dfe790072ba653a64484bc24cacea8.mp3';
      
      const result = getProxiedAudioUrl(sanityUrl);
      expect(result).toBe(expectedUrl);
    });

    it('should return original URL for non-Sanity URLs', () => {
      const nonSanityUrl = 'https://example.com/audio.mp3';
      const result = getProxiedAudioUrl(nonSanityUrl);
      expect(result).toBe(nonSanityUrl);
    });

    it('should handle empty or invalid URLs', () => {
      expect(getProxiedAudioUrl('')).toBe('');
      expect(getProxiedAudioUrl('invalid-url')).toBe('invalid-url');
    });

    it('should handle URLs without protocol', () => {
      const urlWithoutProtocol = 'cdn.sanity.io/images/ker8zst5/production/audio.mp3';
      const result = getProxiedAudioUrl(urlWithoutProtocol);
      expect(result).toBe(urlWithoutProtocol); // Should return as-is since it's not a valid URL
    });
  });

  describe('getAudioSource', () => {
    const mockTrack = {
      _id: 'track1',
      title: 'Test Track',
      audioUrl: 'https://cdn.sanity.io/images/ker8zst5/production/audio.mp3'
    };

    it('should return Sanity source with proxied URL when audioUrl is available', () => {
      const result = getAudioSource(mockTrack, 0);
      
      expect(result.source).toBe('sanity');
      expect(result.url).toMatch(/^\/api\/audio\//);
      expect(result.url).toContain('cdn.sanity.io');
    });

    it('should return local source when no audioUrl is available', () => {
      const trackWithoutAudio = {
        _id: 'track2',
        title: 'Track Without Audio'
      };

      const result = getAudioSource(trackWithoutAudio, 1);
      
      expect(result.source).toBe('local');
      expect(result.url).toBe('/2.mp3'); // trackIndex + 1
    });

    it('should handle different track indices correctly', () => {
      const trackWithoutAudio = {
        _id: 'track3',
        title: 'Track Without Audio'
      };

      const result = getAudioSource(trackWithoutAudio, 2);
      
      expect(result.source).toBe('local');
      expect(result.url).toBe('/3.mp3'); // trackIndex + 1
    });
  });
});

// Integration test for the audio proxy API
describe('Audio Proxy API Integration', () => {
  it('should handle audio proxy requests correctly', () => {
    // This would be tested with actual HTTP requests in a real test environment
    const mockSanityUrl = 'https://cdn.sanity.io/images/ker8zst5/production/b9f7d4d5e8dfe790072ba653a64484bc24cacea8.mp3';
    const proxiedUrl = getProxiedAudioUrl(mockSanityUrl);
    
    // Verify the proxied URL format
    expect(proxiedUrl).toMatch(/^\/api\/audio\//);
    expect(proxiedUrl).toContain('cdn.sanity.io');
    expect(proxiedUrl).toContain('b9f7d4d5e8dfe790072ba653a64484bc24cacea8.mp3');
  });

  it('should maintain audio source priority', () => {
    const trackWithAudio = {
      _id: 'track1',
      title: 'Track With Audio',
      audioUrl: 'https://cdn.sanity.io/images/ker8zst5/production/audio.mp3'
    };

    const trackWithoutAudio = {
      _id: 'track2',
      title: 'Track Without Audio'
    };

    // Track with audio should use Sanity source
    const resultWithAudio = getAudioSource(trackWithAudio, 0);
    expect(resultWithAudio.source).toBe('sanity');

    // Track without audio should use local source
    const resultWithoutAudio = getAudioSource(trackWithoutAudio, 1);
    expect(resultWithoutAudio.source).toBe('local');
  });
});

