/**
 * Audio Utility Functions
 * 
 * This module provides utilities for handling audio files with proper CORS support
 * and fallback mechanisms for different audio sources.
 */

/**
 * Converts a Sanity CDN URL to use our proxy for CORS support
 */
export function getProxiedAudioUrl(sanityUrl: string): string {
  if (!sanityUrl || !sanityUrl.includes('cdn.sanity.io')) {
    return sanityUrl
  }

  try {
    const url = new URL(sanityUrl)
    // Remove the protocol (https://) and use the rest as the path
    const path = url.hostname + url.pathname
    return `/api/audio/${path}`
  } catch (error) {
    console.error('Error parsing Sanity URL:', error)
    return sanityUrl
  }
}

/**
 * Determines the best audio source with fallback support
 */
export function getAudioSource(track: { audioUrl?: string }, trackIndex: number): {
  url: string
  source: 'sanity' | 'local' | 'fallback'
} {
  // First priority: Sanity CMS audio with proxy
  if (track.audioUrl) {
    return {
      url: getProxiedAudioUrl(track.audioUrl),
      source: 'sanity'
    }
  }

  // Fallback: Local audio files
  const localFile = `/${trackIndex + 1}.mp3`
  return {
    url: localFile,
    source: 'local'
  }
}

/**
 * Validates if an audio URL is accessible
 */
export async function validateAudioUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
    })
    return response.ok
  } catch (error) {
    console.warn('Audio URL validation failed:', error)
    return false
  }
}

/**
 * Preloads audio files for better performance
 */
export function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    
    audio.addEventListener('canplaythrough', () => {
      resolve()
    })
    
    audio.addEventListener('error', (error) => {
      reject(error)
    })
    
    audio.src = url
    audio.preload = 'auto'
  })
}

/**
 * Audio loading configuration for different sources
 */
export const audioConfig = {
  sanity: {
    timeout: 10000, // 10 seconds
    retries: 2,
    useProxy: true
  },
  local: {
    timeout: 5000, // 5 seconds
    retries: 1,
    useProxy: false
  }
}

/**
 * Enhanced audio loading with error handling and fallbacks
 */
export async function loadAudioWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  timeout: number = 10000
): Promise<string> {
  try {
    // Try primary URL first
    const isValid = await validateAudioUrl(primaryUrl)
    if (isValid) {
      return primaryUrl
    }
  } catch (error) {
    console.warn('Primary audio URL failed:', error)
  }

  // Try fallback URL
  try {
    const isValid = await validateAudioUrl(fallbackUrl)
    if (isValid) {
      console.log('Using fallback audio URL')
      return fallbackUrl
    }
  } catch (error) {
    console.error('Fallback audio URL also failed:', error)
  }

  throw new Error('All audio sources failed to load')
}

