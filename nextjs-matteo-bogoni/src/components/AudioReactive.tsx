'use client'

import { useEffect, useRef, useState } from 'react'
import { Track } from '@/sanity/client'
import { getAudioSource } from '@/lib/audio-utils'

interface AudioReactiveProps {
  tracks: Track[]
}

declare global {
  interface Window {
    p5: any
    switchTrack: (trackIndex: number) => void
  }
}

export default function AudioReactive({ tracks }: AudioReactiveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<any>(null)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0)
  const audioStartedRef = useRef(false)
  const [debugInfo, setDebugInfo] = useState({
    containerReady: false,
    p5Ready: false
  })
  
  // State for track boxes (hover and progress)
  const [hoverBoxState, setHoverBoxState] = useState<{
    visible: boolean
    y: number
    height: number
    color: string
  } | null>(null)
  
  const [progressBoxState, setProgressBoxState] = useState<{
    visible: boolean
    y: number
    height: number
    width: number
  } | null>(null)

  // Callback function to update selected track index from p5.js
  const updateSelectedTrackIndex = (index: number) => {
    setSelectedTrackIndex(index)
  }
  
  // Callback functions to update box positions from p5.js
  const updateHoverBox = (visible: boolean, y: number, height: number, color: string) => {
    setHoverBoxState(visible ? { visible: true, y, height, color } : null)
  }
  
  const updateProgressBox = (visible: boolean, y: number, height: number, width: number) => {
    setProgressBoxState(visible ? { visible: true, y, height, width } : null)
  }

  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      console.log('=== COMPONENT MOUNT DEBUG ===')
      console.log('Component mounted, starting p5 loading...')
      console.log('Tracks available:', tracks.length)
      console.log('Container ref ready:', !!containerRef.current)
      
      // Update debug state
      setDebugInfo(prev => ({ ...prev, containerReady: !!containerRef.current }))
      
      // Load p5.js dynamically
      const loadP5 = async () => {
      console.log('Starting p5 loading...')
      console.log('Window exists:', typeof window !== 'undefined')
      console.log('p5 exists:', typeof window !== 'undefined' && !!window.p5)
      
      if (typeof window !== 'undefined' && !window.p5) {
        console.log('Loading p5.js script...')
        const p5Script = document.createElement('script')
        p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js'
        p5Script.onload = () => {
          console.log('p5.js loaded successfully')
          const p5SoundScript = document.createElement('script')
          p5SoundScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js'
          p5SoundScript.onload = () => {
            console.log('p5.sound loaded successfully')
            initializeP5()
          }
          p5SoundScript.onerror = (error) => {
            console.error('Failed to load p5.sound:', error)
            initializeP5() // Initialize without sound
          }
          document.head.appendChild(p5SoundScript)
        }
        p5Script.onerror = (error) => {
          console.error('Failed to load p5.js:', error)
        }
        document.head.appendChild(p5Script)
      } else if (window.p5) {
        console.log('p5 already exists, initializing...')
        initializeP5()
      } else {
        console.error('Window is not available')
      }
    }

    const initializeP5 = () => {
      console.log('=== P5 INITIALIZATION DEBUG ===')
      console.log('Container ref:', containerRef.current)
      console.log('Container ref exists:', !!containerRef.current)
      
      if (!containerRef.current) {
        console.error('❌ Container ref is null - cannot initialize p5')
        return
      }

      const p5 = window.p5
      console.log('P5 object:', p5)
      console.log('P5 exists:', !!p5)
      
      if (!p5) {
        console.error('❌ p5 is not available - cannot initialize p5')
        return
      }
      
      console.log('✅ Starting p5 sketch initialization...')
      
      const sketch = (p: any) => {
        let song: any
        let fft: any
        let spectrum: number[] = []
        let charsPerLine: number
        let audioStarted = false
        let canvasContext: CanvasRenderingContext2D | null = null
        let trackLines: string[] = []
        let textLines: string[] = []
        let cursorX = 0
        let effectMultiplier = 2.0
        // Base text size - will be adjusted for mobile
        const baseTextSize = 24
        let textSize = baseTextSize
        // Base line height - will be adjusted for mobile
        const baseLineHeight = 25
        let lineHeight = baseLineHeight
        let trackClickAreas: Array<{x: number, y: number, width: number, height: number, trackIndex: number}> = []
        let selectedTrackIndex = 0
        
        // Metadata
        let metadataClickAreas: Array<{x: number, y: number, width: number, height: number, type: 'email' | 'phone' | 'ig'}> = []
        let totalPlayTime = 0 // Will be calculated from track durations
        let trackDurations: number[] = [] // Duration in seconds for each track
        
        // Hover and progress box state
        let hoveredTrackIndex: number | null = null
        let hoverBoxColor: string = '#FFFFFF' // Current hover color (for non-active tracks)
        let activeTrackIndex: number | null = null
        let activeTrackColor: string = '#FFFFFF' // Locked color for active track
        let trackStartTime = 0 // When the current track started playing
        
        // Color palette for hover boxes
        const hoverColorPalette = [
          '#FFFFFF',
          '#A600FF',
          '#00C8FF',
          '#FFE500',
          '#FF0000',
          '#66FF00'
        ]
        
        // Function to get random color from palette
        const getRandomHoverColor = (): string => {
          return hoverColorPalette[Math.floor(p.random(0, hoverColorPalette.length))]
        }
        
        // Loading animation state
        let isLoading = true
        let loadingStartTime = 0
        let loadingChars: Array<{char: string, x: number, y: number, appeared: boolean, appearTime: number}> = []
        let loadingDuration = 2000 // 2 seconds for all characters to appear
        let charsPerSecond = 0 // Will be calculated based on total characters
        
        // Transition state management
        let isTransitioning = false
        let transitionStartTime = 0
        let transitionDuration = 1500 // 1.5 second transition
        let transitionMultiplier = 1.0 // Current multiplier during transition
        let pendingTrackSwitch = -1 // Track index to switch to at 50% progress
        let hasSwitchedTrack = false // Flag to track if we've already switched tracks
        
        // Mute/Unmute state management
        let isMuted = false
        let isMuteTransitioning = false
        let muteTransitionStartTime = 0
        let muteTransitionMultiplier = 1.0
        let muteClickArea: {x: number, y: number, width: number, height: number} | null = null

        const textContent = "Matteo Bogoni is an audio technician and sound designer with over twenty years of experience, specializing in the creation of soundscapes, multichannel systems, and audio solutions for music, events, advertising, and installations. Since 2005, he has been transforming sound into narrative: from founding MellowSong Studio to working with the Verona Opera Season, and later establishing StudioBoga in Milan, where he explores modular synthesis, field recording, and immersive sound design. Today, he develops thematic and interactive soundscapes that merge technical research with a curatorial vision, crafting acoustic experiences that are essential, contemporary, and deeply evocative."

        // Helper function to set font and letter spacing
        const setFont = () => {
          if (canvasContext) {
            // Set font to Helvetica Neue Medium with current text size
            canvasContext.font = `500 ${textSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`
            // Set letter spacing to 0
            canvasContext.letterSpacing = '0px'
          }
        }

        // Helper function to measure text width
        const measureText = (text: string): number => {
          if (canvasContext) {
            return canvasContext.measureText(text).width
          }
          // Fallback to approximate width if context not available
          return text.length * textSize * 0.67
        }

        // Helper function to measure character width
        const measureChar = (char: string): number => {
          if (canvasContext) {
            return canvasContext.measureText(char).width
          }
          // Fallback to approximate width if context not available
          return textSize * 0.67
        }

        // Helper function to format time as MM:SS
        const formatTime = (seconds: number): string => {
          const mins = Math.floor(seconds / 60)
          const secs = Math.floor(seconds % 60)
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }

        // Helper function to get current date and time
        const getCurrentDateTime = (): string => {
          const now = new Date()
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
          const month = months[now.getMonth()]
          const day = now.getDate().toString().padStart(2, '0')
          const year = now.getFullYear()
          const hours = now.getHours().toString().padStart(2, '0')
          const minutes = now.getMinutes().toString().padStart(2, '0')
          const seconds = now.getSeconds().toString().padStart(2, '0')
          return `${month} ${day}, ${year}, ${hours}:${minutes}:${seconds}`
        }

        // Easing function for smooth transitions
        const easeInOutCubic = (t: number): number => {
          return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        }

        // Generate random full saturation, full luminosity color (HSL: random hue, 100% saturation, 50% lightness for full luminosity)
        const generateRandomColor = (): {r: number, g: number, b: number} => {
          // Random hue (0-360), full saturation (100%), full luminosity (50% lightness in HSL = full luminosity)
          const hue = p.random(0, 360)
          // Convert HSL to RGB
          const c = 1.0 // Chroma (saturation = 100%)
          const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
          const m = 0.5 // Lightness offset (50% lightness)
          
          let r = 0, g = 0, b = 0
          if (hue < 60) {
            r = c; g = x; b = 0
          } else if (hue < 120) {
            r = x; g = c; b = 0
          } else if (hue < 180) {
            r = 0; g = c; b = x
          } else if (hue < 240) {
            r = 0; g = x; b = c
          } else if (hue < 300) {
            r = x; g = 0; b = c
          } else {
            r = c; g = 0; b = x
          }
          
          return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
          }
        }

        // Get track progress percentage (0-100)
        const getTrackProgress = (): number => {
          if (!song || !song.isPlaying() || activeTrackIndex === null || trackDurations[activeTrackIndex] === 0) {
            return 0
          }
          
          try {
            const currentTime = song.currentTime()
            const duration = trackDurations[activeTrackIndex]
            if (duration > 0) {
              return Math.min((currentTime / duration) * 100, 100)
            }
          } catch (e) {
            // Fallback: use elapsed time since track started
            const elapsed = (p.millis() - trackStartTime) / 1000
            const duration = trackDurations[activeTrackIndex]
            if (duration > 0) {
              return Math.min((elapsed / duration) * 100, 100)
            }
          }
          return 0
        }

        // Update hover and progress boxes positions (called from p5.js, rendered as HTML)
        const updateTrackBoxes = (trackY: number, trackIndex: number) => {
          const boxHeight = lineHeight
          // Both boxes on the same line
          const boxY = trackY
          
          // Update hover box (if hovering OR if this is the active track)
          const isHoveringThisTrack = hoveredTrackIndex === trackIndex
          const isActiveTrack = activeTrackIndex === trackIndex
          const shouldShowHoverBox = isHoveringThisTrack || isActiveTrack
          
          if (shouldShowHoverBox) {
            // Use activeTrackColor if it's the active track, otherwise use hoverBoxColor
            const color = isActiveTrack ? activeTrackColor : hoverBoxColor
            updateHoverBox(true, boxY, boxHeight, color)
          } else {
            updateHoverBox(false, 0, 0, '#FFFFFF')
          }
          
          // Update active track progress box (if track is playing) - on top of hover box
          if (isActiveTrack && song && song.isPlaying() && !isMuted) {
            // Check if track just started (within last 100ms) - if so, don't show progress yet
            const timeSinceStart = p.millis() - trackStartTime
            const progress = getTrackProgress()
            const progressWidth = (progress / 100) * p.width
            
            // Only show progress if track has been playing for a bit and progress is valid
            // This prevents showing old track's progress when switching
            if (timeSinceStart > 100 && progressWidth > 0 && progress > 0) {
              updateProgressBox(true, boxY, boxHeight, progressWidth)
            } else {
              updateProgressBox(false, 0, 0, 0)
            }
          } else {
            updateProgressBox(false, 0, 0, 0)
          }
        }

        // Function to start a smooth transition
        const startTransition = (trackIndex: number = -1, wasMuted: boolean = false) => {
          isTransitioning = true
          transitionStartTime = p.millis()
          transitionMultiplier = 1.0
          pendingTrackSwitch = trackIndex
          hasSwitchedTrack = false
          // If we were muted, unmute and stop current track immediately
          if (wasMuted) {
            isMuted = false // Unmute immediately when starting transition
            // Stop current track if it exists (even if not playing due to mute)
            if (song) {
              try {
                song.stop()
              } catch (e) {
                // Ignore errors if already stopped
              }
            }
            // Clear spectrum immediately since there's no audio to fade from
            spectrum.fill(0)
          }
        }

        // Function to get transition multiplier (goes from 1 to 0 to 1)
        const getTransitionMultiplier = (): number => {
          if (!isTransitioning) {
            return 1.0
          }
          
          const elapsed = p.millis() - transitionStartTime
          const progress = Math.min(elapsed / transitionDuration, 1)
          
          // Create a curve that goes from 1 to 0 at 50% progress, then back to 1
          let multiplier: number
          if (progress <= 0.5) {
            // First half: go from 1 to 0
            const firstHalfProgress = progress * 2 // 0 to 1
            multiplier = 1.0 - easeInOutCubic(firstHalfProgress)
            
            // Fade out current track's volume during first half
            if (song && song.isPlaying()) {
              const volume = multiplier // Volume follows the multiplier (1.0 to 0.0)
              song.setVolume(volume)
            }
          } else {
            // Second half: go from 0 back to 1
            const secondHalfProgress = (progress - 0.5) * 2 // 0 to 1
            multiplier = easeInOutCubic(secondHalfProgress)
            
            // Fade in new track's volume during second half
            if (song && song.isPlaying()) {
              const volume = multiplier // Volume follows the multiplier (0.0 to 1.0)
              song.setVolume(volume)
            }
          }
          
          // Switch track at 50% progress (when multiplier reaches 0)
          if (progress >= 0.5 && !hasSwitchedTrack && pendingTrackSwitch >= 0) {
            console.log(`Switching to track ${pendingTrackSwitch} at 50% progress (${progress.toFixed(2)})`)
            selectedTrackIndex = pendingTrackSwitch
            // Update React state
            updateSelectedTrackIndex(pendingTrackSwitch)
            // Set active track when switching
            if (activeTrackIndex !== pendingTrackSwitch) {
              activeTrackIndex = pendingTrackSwitch
              trackStartTime = p.millis()
              // Lock the current hover color if hovering this track, otherwise generate a new one
              if (hoveredTrackIndex === pendingTrackSwitch) {
                activeTrackColor = hoverBoxColor
              } else {
                activeTrackColor = getRandomHoverColor()
              }
              // Clear progress box immediately when switching tracks
              updateProgressBox(false, 0, 0, 0)
            }
            // Start playing the new track immediately when switching
            loadTrack(pendingTrackSwitch, true)
            hasSwitchedTrack = true
          }
          
          transitionMultiplier = multiplier
          
          // End transition when complete
          if (progress >= 1) {
            isTransitioning = false
            transitionMultiplier = 1.0
            pendingTrackSwitch = -1
            hasSwitchedTrack = false
            
            // Ensure final volume is at maximum
            if (song && song.isPlaying()) {
              song.setVolume(1.0)
            }
          }
          
          return multiplier
        }

        // Mute transition state
        let pendingMuteToggle = false
        let hasToggledMute = false

        // Function to toggle mute/unmute with smooth fade
        const toggleMute = () => {
          if (!audioStarted || !song || isMuteTransitioning) {
            return
          }
          
          isMuteTransitioning = true
          muteTransitionStartTime = p.millis()
          pendingMuteToggle = true
          hasToggledMute = false
        }

        // Function to get mute transition multiplier (goes from 1 to 0 when muting, 0 to 1 when unmuting)
        // This affects both volume and text reactive multiplier
        const getMuteTransitionMultiplier = (): number => {
          if (!isMuteTransitioning) {
            return isMuted ? 0.0 : 1.0
          }
          
          const elapsed = p.millis() - muteTransitionStartTime
          const progress = Math.min(elapsed / transitionDuration, 1)
          
          // Toggle mute state at 50% progress
          if (progress >= 0.5 && !hasToggledMute && pendingMuteToggle) {
            isMuted = !isMuted
            hasToggledMute = true
          }
          
          let multiplier: number
          if (progress <= 0.5) {
            // First half: fade out if currently unmuted, stay at 0 if muted
            const firstHalfProgress = progress * 2 // 0 to 1
            if (isMuted) {
              // Currently muted, will unmute - stay at 0 during first half
              multiplier = 0.0
            } else {
              // Currently unmuted, will mute - fade out smoothly
              multiplier = 1.0 - easeInOutCubic(firstHalfProgress)
              if (song && song.isPlaying()) {
                song.setVolume(multiplier)
              }
            }
          } else {
            // Second half: fade in if unmuting, stay at 0 if muting
            const secondHalfProgress = (progress - 0.5) * 2 // 0 to 1
            if (isMuted) {
              // Now muted - stay at 0
              multiplier = 0.0
              if (song && song.isPlaying()) {
                song.setVolume(0.0)
              }
            } else {
              // Now unmuted - fade in smoothly
              multiplier = easeInOutCubic(secondHalfProgress)
              if (song && song.isPlaying()) {
                song.setVolume(multiplier)
              }
            }
          }
          
          muteTransitionMultiplier = multiplier
          
          // End transition when complete
          if (progress >= 1) {
            isMuteTransitioning = false
            pendingMuteToggle = false
            hasToggledMute = false
            muteTransitionMultiplier = isMuted ? 0.0 : 1.0
            if (song && song.isPlaying() && !isMuted) {
              song.setVolume(1.0)
            }
          }
          
          return multiplier
        }

        const loadTrack = (trackIndex: number, shouldPlayImmediately: boolean = false) => {
          console.log(`loadTrack called: trackIndex=${trackIndex}, shouldPlayImmediately=${shouldPlayImmediately}, isTransitioning=${isTransitioning}`)
          
          // Clear progress box immediately when switching tracks
          updateProgressBox(false, 0, 0, 0)
          
          // Immediately stop current audio and clear spectrum to prevent old audio affecting animation
          if (song) {
            try {
              song.stop()
              song.dispose()
            } catch (error) {
              console.log('Error stopping/disposing song:', error)
            }
            song = null
          }
          
          // Clear spectrum immediately to stop animation from old track
          spectrum.fill(0)
          
          // Load new track immediately
          const trackToLoad = tracks.length > 0 ? tracks[trackIndex] : null
          
          if (trackToLoad) {
            // Get the best audio source with CORS support
            const { url: audioUrl, source } = getAudioSource(trackToLoad, trackIndex)
            
            console.log(`Loading audio from ${source}: ${audioUrl}`)
            
            song = p.loadSound(audioUrl, () => {
              console.log(`Audio loaded successfully from ${source}: ${audioUrl}`)
              
              // Try to get duration and update trackDurations
              try {
                if (song && typeof song.duration === 'function') {
                  const duration = song.duration()
                  if (duration && duration > 0) {
                    trackDurations[trackIndex] = duration
                    totalPlayTime = trackDurations.reduce((sum, dur) => sum + dur, 0)
                  }
                } else if (song && song.buffer && song.buffer.duration) {
                  const duration = song.buffer.duration
                  trackDurations[trackIndex] = duration
                  totalPlayTime = trackDurations.reduce((sum, dur) => sum + dur, 0)
                }
              } catch (e) {
                console.log('Could not get audio duration:', e)
              }
              
              // Only play if explicitly requested
              if (shouldPlayImmediately) {
                try {
                  song.play()
                  song.loop()
                  
                  // Set initial volume based on transition state
                  if (isTransitioning) {
                    // If we're transitioning, start at volume 0 (will be faded in)
                    song.setVolume(0)
                  } else {
                    // Normal playback at full volume
                    song.setVolume(1.0)
                  }
                  
                  console.log(`Playing audio from ${source}`)
                } catch (error) {
                  console.error(`Error playing audio from ${source}:`, error)
                  // Try fallback if current source fails
                  if (source === 'sanity') {
                    const fallbackFile = `/${trackIndex + 1}.mp3`
                    console.log(`Trying fallback audio: ${fallbackFile}`)
                    song = p.loadSound(fallbackFile, () => {
                      console.log(`Fallback audio loaded: ${fallbackFile}`)
                      if (shouldPlayImmediately) {
                        try {
                          song.play()
                          song.loop()
                          
                          // Set initial volume based on transition state
                          if (isTransitioning) {
                            song.setVolume(0)
                          } else {
                            song.setVolume(1.0)
                          }
                        } catch (fallbackError) {
                          console.error('Error playing fallback audio:', fallbackError)
                        }
                      }
                    }, (fallbackLoadError: any) => {
                      console.error(`Failed to load fallback audio: ${fallbackFile}`, fallbackLoadError)
                    })
                  }
                }
              }
            }, (error: any) => {
              console.error(`Failed to load audio from ${source}: ${audioUrl}`, error)
              // Try fallback if current source fails
              if (source === 'sanity') {
                const fallbackFile = `/${trackIndex + 1}.mp3`
                console.log(`Loading fallback audio: ${fallbackFile}`)
                song = p.loadSound(fallbackFile, () => {
                  console.log(`Fallback audio loaded: ${fallbackFile}`)
                  if (shouldPlayImmediately) {
                    try {
                      song.play()
                      song.loop()
                      
                      // Set initial volume based on transition state
                      if (isTransitioning) {
                        song.setVolume(0)
                      } else {
                        song.setVolume(1.0)
                      }
                    } catch (error) {
                      console.error('Error playing fallback audio:', error)
                    }
                  }
                }, (fallbackError: any) => {
                  console.error(`Failed to load fallback audio: ${fallbackFile}`, fallbackError)
                })
              }
            })
          } else {
            // No tracks available, try local files
            const localFile = `/${trackIndex + 1}.mp3`
            console.log(`Loading local audio: ${localFile}`)
            song = p.loadSound(localFile, () => {
              console.log(`Local audio loaded: ${localFile}`)
              if (shouldPlayImmediately) {
                try {
                  song.play()
                  song.loop()
                  
                  // Set initial volume based on transition state
                  if (isTransitioning) {
                    song.setVolume(0)
                  } else {
                    song.setVolume(1.0)
                  }
                } catch (error) {
                  console.error('Error playing local audio:', error)
                }
              }
            }, (error: any) => {
              console.error(`Failed to load local audio: ${localFile}`, error)
            })
          }
        }

        p.preload = () => {
          // Debug: Log tracks data
          console.log('Tracks data:', tracks)
          console.log('Number of tracks:', tracks.length)
          tracks.forEach((track, index) => {
            console.log(`Track ${index}:`, track.title, 'Audio URL:', track.audioUrl)
          })
          
          // Create track lines from props (for new layout, we'll store track data separately)
          trackLines = []
          trackDurations = []
          
          if (tracks.length > 0) {
            tracks.forEach((track, index) => {
              // Store track title and duration
              trackLines.push(track.title)
              // For now, we'll need to get duration from audio files or use a default
              // This will be updated when audio loads
              trackDurations.push(0) // Will be updated when audio loads
            })
          } else {
            trackLines.push('Default Track 1')
            trackLines.push('Default Track 2')
            trackLines.push('Default Track 3')
            trackDurations = [0, 0, 0]
          }
          
          // Calculate total play time (will be updated when durations are known)
          totalPlayTime = trackDurations.reduce((sum, dur) => sum + dur, 0)

          // Don't load any track initially - wait for user to click a track
          console.log('Waiting for user to select a track')
        }

        // Function to hyphenate a word that's too long to fit on a line
        const hyphenateWord = (word: string, maxLength: number): string[] => {
          if (word.length <= maxLength) {
            return [word]
          }
          
          const parts: string[] = []
          let remaining = word
          
          while (remaining.length > maxLength) {
            // Try to break at a good position (prefer breaking after 3+ characters, avoid breaking at start)
            let breakPoint = maxLength - 1
            // Prefer breaking after vowels or common consonants
            const vowels = 'aeiouAEIOU'
            for (let i = Math.min(breakPoint, remaining.length - 2); i >= 2; i--) {
              if (vowels.includes(remaining[i]) || ['r', 'l', 'n', 'm', 's', 't'].includes(remaining[i].toLowerCase())) {
                breakPoint = i + 1
                break
              }
            }
            
            parts.push(remaining.substring(0, breakPoint) + '-')
            remaining = remaining.substring(breakPoint)
          }
          
          if (remaining.length > 0) {
            parts.push(remaining)
          }
          
          return parts
        }

        // Function to recalculate text lines based on actual text width
        const recalculateTextLines = () => {
          textLines = []
          const words = textContent.split(' ')
          let currentLine = ''
          const leftMargin = 10
          const rightMargin = 10
          const maxLineWidth = p.width - leftMargin - rightMargin
          
          // Ensure font is set before measuring
          setFont()
          
          for (let word of words) {
            const spaceWidth = currentLine.length > 0 ? measureText(' ') : 0
            const wordWidth = measureText(word)
            const currentLineWidth = measureText(currentLine)
            const totalWidth = currentLineWidth + spaceWidth + wordWidth
            
            // Check if word fits on current line
            if (totalWidth <= maxLineWidth) {
              currentLine = currentLine.length > 0 ? currentLine + ' ' + word : word
            } else {
              // Current line is full, push it
              if (currentLine.length > 0) {
                textLines.push(currentLine.trim())
                currentLine = ''
              }
              
              // Check if word itself is too long for a line
              if (wordWidth > maxLineWidth) {
                // Hyphenate the word by character width
                let remainingWord = word
                while (remainingWord.length > 0) {
                  let part = ''
                  let partWidth = 0
                  
                  // Build part character by character until it fits
                  for (let i = 0; i < remainingWord.length; i++) {
                    const char = remainingWord[i]
                    const charWidth = measureChar(char)
                    if (partWidth + charWidth <= maxLineWidth - measureText('-')) {
                      part += char
                      partWidth += charWidth
                    } else {
                      break
                    }
                  }
                  
                  if (part.length > 0) {
                    // Add hyphen if not the last part
                    if (remainingWord.length > part.length) {
                      part += '-'
                    }
                    textLines.push(part)
                    remainingWord = remainingWord.substring(part.length - (part.endsWith('-') ? 1 : 0))
                  } else {
                    // Single character that's too wide, just add it
                    textLines.push(remainingWord[0])
                    remainingWord = remainingWord.substring(1)
                  }
                }
              } else {
                // Word fits on a new line
                currentLine = word
              }
            }
          }
          
          if (currentLine.length > 0) {
            textLines.push(currentLine.trim())
          }
        }

        // Initialize loading animation with correct character positions
        const initializeLoadingAnimation = () => {
          loadingChars = []
          const leftMargin = 10
          const topMargin = 10
          const startY = topMargin + textSize - 5
          
          // Ensure font is set before measuring
          setFont()
          
          // Left column: metadata
          let y = startY
          const metadata = [
            { label: 'COMPOSER', value: 'Matteo Bogoni' },
            { label: 'DATE', value: getCurrentDateTime() },
            { label: 'LOCATION', value: 'Milan' },
            { label: 'TRACKS PLAY TIME', value: formatTime(totalPlayTime) },
            { label: 'N° OF TRACKS', value: tracks.length.toString() },
            { label: 'EMAIL', value: 'info@matteobogoni.com' },
            { label: 'PHONE', value: '+39 3490867743' },
            { label: 'IG', value: '@matteobogoni' }
          ]
          
          // Check if mobile
          const isMobile = p.windowWidth <= 768
          
          // Find the maximum label width to align all values at the same position
          let maxLabelWidth = 0
          for (const item of metadata) {
            const labelWidth = measureText(item.label)
            if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth
            }
          }
          
          // Fixed position for all values
          // On mobile: start at 50vw (center), on desktop: aligned to the right of the longest label + 30px spacing
          const valueX = isMobile ? (p.width / 2) : (leftMargin + maxLabelWidth + 30)
          
          for (let i = 0; i < metadata.length; i++) {
            const item = metadata[i]
            
            // Draw label characters
            let x = leftMargin
            for (let charIndex = 0; charIndex < item.label.length; charIndex++) {
              const char = item.label.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
            
            // Draw value characters (starting at valueX)
            x = valueX
            for (let charIndex = 0; charIndex < item.value.length; charIndex++) {
              const char = item.value.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
            y += lineHeight
            
            // Add line break after COMPOSER (index 0) and after N° OF TRACKS (index 4)
            if (i === 0 || i === 4) {
              y += lineHeight
            }
          }
          
          // On mobile: Draw MUTE button at top right first
          if (isMobile) {
            const muteText = "MUTE"
            const muteTextWidth = measureText(muteText)
            const muteTextX = p.width - 10 - muteTextWidth // Top right
            let x = muteTextX
            for (let charIndex = 0; charIndex < muteText.length; charIndex++) {
              const char = muteText.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: startY,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
          }
          
          // Right column: tracks with times
          // On mobile: stack below left column with 2 line breaks, on desktop: side by side
          let rightColumnStartY = startY
          if (isMobile) {
            // Left column has 8 items + 2 line breaks = 10 lines total
            rightColumnStartY = y + (2 * lineHeight) // Two line breaks
          }
          
          const columnLeftMargin = isMobile ? leftMargin : (p.width / 2 + 20)
          y = rightColumnStartY
          for (let i = 0; i < trackLines.length; i++) {
            const trackTitle = trackLines[i]
            const trackDuration = trackDurations[i] || 0
            const durationText = formatTime(trackDuration)
            const trackText = `${i + 1}. ${trackTitle}`
            
            // Track text
            let x = columnLeftMargin
            for (let charIndex = 0; charIndex < trackText.length; charIndex++) {
              const char = trackText.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
            
            // Duration text
            const durationWidth = measureText(durationText)
            const durationX = p.width - 10 - durationWidth
            x = durationX
            for (let charIndex = 0; charIndex < durationText.length; charIndex++) {
              const char = durationText.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
            y += lineHeight
          }
          
          // On desktop: Add line break before MUTE button
          if (!isMobile) {
            y += lineHeight
            
            // MUTE button (right-aligned, all caps)
            const muteText = "MUTE"
            const muteTextWidth = measureText(muteText)
            const muteTextX = p.width - 10 - muteTextWidth // Right-aligned like durations
            let x = muteTextX
            for (let charIndex = 0; charIndex < muteText.length; charIndex++) {
              const char = muteText.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
          }
          
          // Calculate correct positions for main text lines
          const mainTextStartY = p.height - 10 - ((textLines.length - 1) * lineHeight)
          y = mainTextStartY
          for (let lineIndex = 0; lineIndex < textLines.length; lineIndex++) {
            const line = textLines[lineIndex] || ''
            if (!line) {
              y += lineHeight
              continue
            }
            
            let x = leftMargin
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line.charAt(charIndex)
              loadingChars.push({
                char: char,
                x: x,
                y: y,
                appeared: false,
                appearTime: 0
              })
              x += measureChar(char)
            }
            y += lineHeight
          }
          
          // Calculate how many characters should appear per second
          charsPerSecond = loadingChars.length / (loadingDuration / 1000)
          
          // Assign random appearance times to each character
          loadingChars.forEach((charData, index) => {
            charData.appearTime = (index / charsPerSecond) * 1000
          })
          
          // Shuffle the appearance times to make it more random
          for (let i = loadingChars.length - 1; i > 0; i--) {
            const j = Math.floor(p.random(0, i + 1));
            [loadingChars[i].appearTime, loadingChars[j].appearTime] = [loadingChars[j].appearTime, loadingChars[i].appearTime]
          }
          
          loadingStartTime = p.millis()
        }

        p.setup = () => {
          console.log('=== P5 SETUP DEBUG ===')
          console.log('Setting up canvas...')
          console.log('Window dimensions:', p.windowWidth, p.windowHeight)
          console.log('Container ref:', containerRef.current)
          
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
          console.log('Canvas created:', canvas)
          console.log('Canvas element:', canvas.elt)
          
          canvas.parent(containerRef.current)
          console.log('Canvas parent set:', canvas.parent())
          
          // Force canvas to be visible
          canvas.elt.style.position = 'absolute'
          canvas.elt.style.top = '0'
          canvas.elt.style.left = '0'
          canvas.elt.style.zIndex = '10'
          canvas.elt.style.backgroundColor = 'white'
          console.log('✅ Canvas styling applied')
          
          // Adjust text size and line height for mobile (35% reduction = 65% of original)
          const isMobile = p.windowWidth <= 768
          textSize = isMobile ? baseTextSize * 0.65 : baseTextSize
          // Line height is 95% of base on desktop, 95% of 65% on mobile
          lineHeight = isMobile ? baseLineHeight * 0.65 * 0.95 : baseLineHeight * 0.95
          
          // Setup canvas context and font first (needed for text measurements)
          if (canvas && canvas.elt) {
            canvasContext = canvas.elt.getContext('2d')
            setFont()
          }
          
          // Create text lines (will use actual text width measurements)
          recalculateTextLines()
          
          // Calculate charsPerLine for spectrum array (approximate, for audio reactivity)
          const leftMargin = 10
          const rightMargin = 10
          const availableWidth = p.width - leftMargin - rightMargin
          const avgCharWidth = measureText('M') // Use 'M' as average character width
          charsPerLine = Math.floor(availableWidth / avgCharWidth)
          
          // Handle window resize
          p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight)
            // Adjust text size and line height for mobile (35% reduction = 65% of original)
            const isMobile = p.windowWidth <= 768
            textSize = isMobile ? baseTextSize * 0.65 : baseTextSize
            // Line height is 95% of base on desktop, 95% of 65% on mobile
            lineHeight = isMobile ? baseLineHeight * 0.65 * 0.95 : baseLineHeight * 0.95
            // Update font with new text size
            setFont()
            // Recalculate text lines for new width (uses actual text width)
            recalculateTextLines()
            // Calculate charsPerLine for spectrum array (approximate, for audio reactivity)
            const leftMargin = 10
            const rightMargin = 10
            const availableWidth = p.width - leftMargin - rightMargin
            const avgCharWidth = measureText('M') // Use 'M' as average character width
            charsPerLine = Math.floor(availableWidth / avgCharWidth)
            spectrum = new Array(charsPerLine).fill(0)
            // Reinitialize loading animation with new text size
            initializeLoadingAnimation()
          }
          
          // Setup audio
          fft = new p5.FFT(0.8, 64)
          spectrum = new Array(charsPerLine).fill(0)
          
          // Initialize loading animation
          initializeLoadingAnimation()
        }

        p.draw = () => {
          // Debug: Log draw calls occasionally
          if (p.frameCount % 60 === 0) {
            console.log('P5 draw function called, frame:', p.frameCount)
          }
          
          cursorX = p.mouseX
          p.background(255, 255, 255)
          
          // Always call getTransitionMultiplier() to ensure track switching logic executes
          getTransitionMultiplier()
          
          // Always call getMuteTransitionMultiplier() to handle mute/unmute transitions
          getMuteTransitionMultiplier()
          
          // Check if we're still in loading animation
          if (isLoading) {
            const elapsed = p.millis() - loadingStartTime
            
            // Update which characters should appear (no fade, instant appearance)
            loadingChars.forEach(charData => {
              if (!charData.appeared && elapsed >= charData.appearTime) {
                charData.appeared = true
              }
            })
            
            // Set up clickable area for "MUTE" button even during loading
            const muteText = "MUTE"
            const rightMargin = 10
            const topMargin = 10
            const textX = p.width - rightMargin - (muteText.length * textSize * 0.67)
            const textY = topMargin + textSize - 5
            muteClickArea = {
              x: textX - 5,
              y: textY - textSize + 5,
              width: muteText.length * textSize * 0.67 + 10,
              height: lineHeight
            }
            
            // Draw loading characters
            p.textSize(textSize)
            setFont()
            p.fill(0)
            
            loadingChars.forEach(charData => {
              if (charData.appeared) {
                p.text(charData.char, charData.x, charData.y)
              }
            })
            
            // End loading animation after duration
            if (elapsed >= loadingDuration) {
              isLoading = false
            }
            
            return // Don't draw normal content during loading
          }
          
          // Get mute and transition multipliers
          const muteMultiplier = getMuteTransitionMultiplier()
          const effectiveMultiplier = muteMultiplier * transitionMultiplier
          
          // Draw two-column layout
          const topMargin = 10
          const startY = topMargin + textSize - 5
          const isMobile = p.windowWidth <= 768
          
          // Draw left column (metadata)
          const leftColumnEndY = drawLeftColumn(startY, isMobile)
          
          // Calculate right column start position
          // On mobile: stack vertically with 2 line breaks
          // On desktop: side by side
          let rightColumnStartY = startY
          if (isMobile) {
            // Left column has 8 items + 2 line breaks = 10 lines total
            rightColumnStartY = leftColumnEndY + (2 * lineHeight) // Two line breaks
          }
          
          // Draw right column (tracks and play/pause)
          drawRightColumn(rightColumnStartY, isMobile, startY)
          
          // Analyze audio if song exists and is playing (even during pause transition for fade effect)
          if (song && song.isPlaying() && effectiveMultiplier > 0) {
            const rawSpectrum = fft.analyze()
            const maxFreqBins = 32
            
            // Update spectrum with current track's audio data
            for (let i = 0; i < Math.min(spectrum.length, maxFreqBins); i++) {
              spectrum[i] = rawSpectrum[i]
            }
            
            // Draw main text with audio reactive displacement
            const mainTextStartY = p.height - 10 - ((textLines.length - 1) * lineHeight)
            drawReactiveText(textLines, mainTextStartY, lineHeight)
          } else {
            // Clear spectrum when no audio is playing or paused to stop animation
            if (effectiveMultiplier <= 0 || !song || !song.isPlaying()) {
              spectrum.fill(0)
            }
            
            // Draw main text when no audio is playing or paused
            const mainTextStartY = p.height - 10 - ((textLines.length - 1) * lineHeight)
            drawStaticText(textLines, mainTextStartY, lineHeight)
          }
        }

        const drawReactiveText = (lines: string[], startY: number, lineHeight: number) => {
          let y = startY
          const leftMargin = 10
          p.textSize(textSize)
          setFont()
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex]
            if (!line) {
              y += lineHeight
              continue
            }
            
            // Calculate line width and center for mirrored audio reactivity
            const lineWidth = measureText(line)
            const lineCenterX = leftMargin + lineWidth / 2
            
            let x = leftMargin
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line.charAt(charIndex)
              const charWidth = measureChar(char)
              
              // Calculate distance from center (in pixels)
              const charCenterX = x + charWidth / 2
              const distanceFromCenter = Math.abs(charCenterX - lineCenterX)
              const maxDistance = lineWidth / 2
              
              // Map distance from center to spectrum index (flipped: center = low, edges = high)
              // Center (distance 0) maps to low spectrum values, edges map to high values
              const maxFreqBins = 32
              const normalizedDistance = maxDistance > 0 ? distanceFromCenter / maxDistance : 0 // 0 at center, 1 at edges
              // Flipped: 0 distance (center) → low spectrum index, 1 distance (edges) → high spectrum index
              const specIndex = Math.floor(p.map(normalizedDistance, 0, 1, 0, maxFreqBins - 1))
              const baseDisplacement = -(spectrum[specIndex] || 0) / 255 * effectMultiplier * 100
              
              // Calculate circular distance from cursor (both x and y coordinates)
              const cursorY = p.mouseY
              const distanceX = Math.abs(cursorX - charCenterX)
              const distanceY = Math.abs(cursorY - y)
              const circularDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
              
              const progressiveRadius = 200
              let progressiveMultiplier = 1.0
              
              if (circularDistance <= progressiveRadius) {
                const normalizedDistance = circularDistance / progressiveRadius
                const falloff = (1 + Math.cos(normalizedDistance * Math.PI)) / 2
                // Reduce displacement to 0% at cursor center
                progressiveMultiplier = 1.0 - falloff // Reduces displacement to 0% at cursor center
              }
              
              // Apply transition multiplier and mute multiplier to the displacement
              const transitionMult = getTransitionMultiplier()
              const muteMult = getMuteTransitionMultiplier()
              const displacement = baseDisplacement * progressiveMultiplier * transitionMult * muteMult
              
              p.fill(0)
              p.text(char, x, y + displacement)
              
              x += charWidth
            }
            y += lineHeight
          }
        }

        const drawReactiveTextWithClicks = (lines: string[], startY: number, lineHeight: number) => {
          let y = startY
          const leftMargin = 10
          trackClickAreas = [] // Reset click areas
          p.textSize(textSize)
          setFont()
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex]
            if (!line) {
              y += lineHeight
              continue
            }
            
            // Check if this line is a track line (starts with number and dot)
            const trackMatch = line.match(/^(\d+)\.\s+(.+)$/)
            let isTrackLine = false
            let trackIndex = -1
            
            if (trackMatch) {
              isTrackLine = true
              trackIndex = parseInt(trackMatch[1]) - 1 // Convert to 0-based index
            }
            
            // Calculate line width and center for mirrored audio reactivity
            const lineWidth = measureText(line)
            const lineCenterX = leftMargin + lineWidth / 2
            
            // Check if mouse is hovering over this track line
            let isHovering = false
            if (isTrackLine && trackIndex >= 0) {
              const lineX = leftMargin
              const lineY = y - textSize + 5
              
              // Check if mouse is within the line bounds
              isHovering = p.mouseX >= lineX && p.mouseX <= lineX + lineWidth &&
                          p.mouseY >= lineY && p.mouseY <= lineY + lineHeight
              
              // Add click area for track lines
              trackClickAreas.push({
                x: lineX,
                y: lineY,
                width: lineWidth,
                height: lineHeight,
                trackIndex: trackIndex
              })
            }
            
            let x = leftMargin
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line.charAt(charIndex)
              const charWidth = measureChar(char)
              
              // Calculate distance from center (in pixels)
              const charCenterX = x + charWidth / 2
              const distanceFromCenter = Math.abs(charCenterX - lineCenterX)
              const maxDistance = lineWidth / 2
              
              // Map distance from center to spectrum index (flipped: center = low, edges = high)
              // Center (distance 0) maps to low spectrum values, edges map to high values
              const maxFreqBins = 32
              const normalizedDistance = maxDistance > 0 ? distanceFromCenter / maxDistance : 0 // 0 at center, 1 at edges
              // Flipped: 0 distance (center) → low spectrum index, 1 distance (edges) → high spectrum index
              const specIndex = Math.floor(p.map(normalizedDistance, 0, 1, 0, maxFreqBins - 1))
              const baseDisplacement = -(spectrum[specIndex] || 0) / 255 * effectMultiplier * 100
              
              // Calculate circular distance from cursor (both x and y coordinates)
              const cursorY = p.mouseY
              const distanceX = Math.abs(cursorX - charCenterX)
              const distanceY = Math.abs(cursorY - y)
              const circularDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
              
              const progressiveRadius = 200
              let progressiveMultiplier = 1.0
              
              if (circularDistance <= progressiveRadius) {
                const normalizedDistance = circularDistance / progressiveRadius
                const falloff = (1 + Math.cos(normalizedDistance * Math.PI)) / 2
                // Reduce displacement to 0% at cursor center
                progressiveMultiplier = 1.0 - falloff // Reduces displacement to 0% at cursor center
              }
              
              // Apply transition multiplier and mute multiplier to the displacement
              const transitionMult = getTransitionMultiplier()
              const muteMult = getMuteTransitionMultiplier()
              const displacement = baseDisplacement * progressiveMultiplier * transitionMult * muteMult
              
              // Set text color: always black
              p.fill(0) // Black
              
              p.text(char, x, y + displacement)
              
              x += charWidth
            }
            
            y += lineHeight
          }
        }

        const drawStaticTextWithClicks = (lines: string[], startY: number, lineHeight: number) => {
          let y = startY
          const leftMargin = 10
          trackClickAreas = [] // Reset click areas
          p.textSize(textSize)
          setFont()
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex] || ''
            if (!line) {
              y += lineHeight
              continue
            }
            
            // Check if this line is a track line (starts with number and dot)
            const trackMatch = line.match(/^(\d+)\.\s+(.+)$/)
            let isTrackLine = false
            let trackIndex = -1
            
            if (trackMatch) {
              isTrackLine = true
              trackIndex = parseInt(trackMatch[1]) - 1 // Convert to 0-based index
            }
            
            // Calculate actual line width
            const lineWidth = measureText(line)
            
            // Check if mouse is hovering over this track line
            let isHovering = false
            if (isTrackLine && trackIndex >= 0) {
              const lineX = leftMargin
              const lineY = y - textSize + 5
              
              // Check if mouse is within the line bounds
              isHovering = p.mouseX >= lineX && p.mouseX <= lineX + lineWidth &&
                          p.mouseY >= lineY && p.mouseY <= lineY + lineHeight
              
              // Add click area for track lines
              trackClickAreas.push({
                x: lineX,
                y: lineY,
                width: lineWidth,
                height: lineHeight,
                trackIndex: trackIndex
              })
            }
            
            // Render each character individually to match reactive text positioning
            let x = leftMargin
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line.charAt(charIndex)
              const charWidth = measureChar(char)
              
              // Set text color: always black
              p.fill(0) // Black
              
              p.text(char, x, y)
              
              x += charWidth
            }
            
            y += lineHeight
          }
        }

        const drawStaticText = (lines: string[], startY: number, lineHeight: number) => {
          let y = startY
          const leftMargin = 10
          p.textSize(textSize)
          setFont()
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex] || ''
            if (!line) {
              y += lineHeight
              continue
            }
            
            // Render each character individually to match reactive text positioning
            let x = leftMargin
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line.charAt(charIndex)
              const charWidth = measureChar(char)
              
              p.fill(0)
              p.text(char, x, y)
              
              x += charWidth
            }
            
            y += lineHeight
          }
        }

        // Draw left column with metadata
        const drawLeftColumn = (startY: number, isMobile: boolean = false): number => {
          const leftMargin = 10
          let y = startY
          p.textSize(textSize)
          setFont()
          metadataClickAreas = []
          
          // Static labels and dynamic values
          const metadata = [
            { label: 'COMPOSER', value: 'Matteo Bogoni' },
            { label: 'DATE', value: getCurrentDateTime() },
            { label: 'LOCATION', value: 'Milan' },
            { label: 'TRACKS PLAY TIME', value: formatTime(totalPlayTime) },
            { label: 'N° OF TRACKS', value: tracks.length.toString() },
            { label: 'EMAIL', value: 'info@matteobogoni.com', clickable: true, type: 'email' as const },
            { label: 'PHONE', value: '+39 3490867743', clickable: true, type: 'phone' as const },
            { label: 'IG', value: '@matteobogoni', clickable: true, type: 'ig' as const }
          ]
          
          // Find the maximum label width to align all values at the same position
          let maxLabelWidth = 0
          for (const item of metadata) {
            const labelWidth = measureText(item.label)
            if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth
            }
          }
          
          // Fixed position for all values
          // On mobile: start at 50vw (center), on desktop: aligned to the right of the longest label + 30px spacing
          const valueX = isMobile ? (p.width / 2) : (leftMargin + maxLabelWidth + 30)
          
          for (let i = 0; i < metadata.length; i++) {
            const item = metadata[i]
            
            // Draw label
            p.fill(0)
            p.text(item.label, leftMargin, y)
            
            // Draw value (check if clickable)
            if (item.clickable) {
              const valueWidth = measureText(item.value)
              const valueY = y - textSize + 5
              
              // Check if hovering
              const isHovering = p.mouseX >= valueX && p.mouseX <= valueX + valueWidth &&
                               p.mouseY >= valueY && p.mouseY <= valueY + lineHeight
              
              // Draw value (underline if hovering)
              if (isHovering) {
                p.fill(100) // Gray for hover
                // Draw underline
                const underlineY = y + 2
                p.stroke(100)
                p.strokeWeight(1)
                p.line(valueX, underlineY, valueX + valueWidth, underlineY)
                p.noStroke()
              } else {
                p.fill(0)
              }
              
              // Store click area
              metadataClickAreas.push({
                x: valueX,
                y: valueY,
                width: valueWidth,
                height: lineHeight,
                type: item.type
              })
            } else {
              p.fill(0)
            }
            
            p.text(item.value, valueX, y)
            y += lineHeight
            
            // Add line break after COMPOSER (index 0) and after N° OF TRACKS (index 4)
            if (i === 0 || i === 4) {
              y += lineHeight
            }
          }
          
          return y // Return the end Y position
        }

        // Draw right column with tracks and times
        const drawRightColumn = (startY: number, isMobile: boolean = false, topMarginY: number = 0) => {
          const leftMargin = 10
          // On mobile: use left margin, on desktop: use right column position
          const columnLeftMargin = isMobile ? leftMargin : (p.width / 2 + 20)
          let y = startY
          p.textSize(textSize)
          setFont()
          trackClickAreas = []
          
          // On mobile: Draw MUTE/UNMUTE button at top right first
          if (isMobile && topMarginY > 0) {
            const muteMultiplier = getMuteTransitionMultiplier()
            const displayText = isMuted ? "UNMUTE" : "MUTE"
            const textWidth = measureText(displayText)
            const textX = p.width - 10 - textWidth // Top right
            const textY = topMarginY
            
            // Set up clickable area
            muteClickArea = {
              x: textX - 5,
              y: textY - textSize + 5,
              width: textWidth + 10,
              height: lineHeight
            }
            
            // Draw MUTE/UNMUTE text
            p.fill(0)
            p.text(displayText, textX, textY)
          }
          
          // Draw tracks with times
          let hoveredBoxTrackIndex: number | null = null
          let hoveredBoxY: number = 0
          let activeBoxTrackIndex: number | null = null
          let activeBoxY: number = 0
          
          for (let i = 0; i < trackLines.length; i++) {
            const trackTitle = trackLines[i]
            const trackDuration = trackDurations[i] || 0
            const durationText = formatTime(trackDuration)
            
            // Track number and title
            const trackText = `${i + 1}. ${trackTitle}`
            const trackTextWidth = measureText(trackText)
            const trackX = columnLeftMargin
            
            // Duration on the right
            const durationWidth = measureText(durationText)
            const durationX = p.width - 10 - durationWidth
            
            // Check if hovering over track
            const lineY = y - textSize + 5
            const isHovering = p.mouseX >= trackX && p.mouseX <= durationX + durationWidth &&
                             p.mouseY >= lineY && p.mouseY <= lineY + lineHeight
            
            // Update hover state (but don't override active track)
            if (isHovering) {
              // Generate new random color when hover starts on a new track (only for non-active tracks)
              if (hoveredTrackIndex !== i) {
                if (activeTrackIndex === i) {
                  // Use locked color for active track
                  hoverBoxColor = activeTrackColor
                } else {
                  // Generate random color for other tracks
                  hoverBoxColor = getRandomHoverColor()
                }
              }
              hoveredTrackIndex = i
            } else if (activeTrackIndex !== i) {
              // Only clear hover if not the active track
              if (hoveredTrackIndex === i) {
                hoveredTrackIndex = null
              }
            }
            
            // Track which track should show boxes (prioritize hovered over active)
            const isHoveringThisTrack = hoveredTrackIndex === i
            const isActiveTrack = activeTrackIndex === i
            
            if (isHoveringThisTrack) {
              hoveredBoxTrackIndex = i
              hoveredBoxY = lineY
            }
            
            if (isActiveTrack) {
              activeBoxTrackIndex = i
              activeBoxY = lineY
            }
            
            // Draw track (always black)
            p.fill(0) // Black
            p.text(trackText, trackX, y)
            
            // Draw duration
            p.fill(0)
            p.text(durationText, durationX, y)
            
            // Store click area
            trackClickAreas.push({
              x: trackX,
              y: lineY,
              width: durationX + durationWidth - trackX,
              height: lineHeight,
              trackIndex: i
            })
            
            y += lineHeight
          }
          
          // Update hover and progress boxes once per frame (rendered as HTML outside canvas)
          // Prioritize hovered track over active track
          const currentBoxTrackIndex = hoveredBoxTrackIndex !== null ? hoveredBoxTrackIndex : activeBoxTrackIndex
          const currentBoxY = hoveredBoxTrackIndex !== null ? hoveredBoxY : activeBoxY
          
          if (currentBoxTrackIndex !== null) {
            updateTrackBoxes(currentBoxY, currentBoxTrackIndex)
          } else {
            // No track hovered or active, hide boxes
            updateHoverBox(false, 0, 0, '#FFFFFF')
            updateProgressBox(false, 0, 0, 0)
          }
          
          // Reset hover state if not hovering over any track (but keep active track)
          if (hoveredTrackIndex !== null && hoveredTrackIndex !== activeTrackIndex) {
            let stillHovering = false
            for (let area of trackClickAreas) {
              if (p.mouseX >= area.x && p.mouseX <= area.x + area.width &&
                  p.mouseY >= area.y && p.mouseY <= area.y + area.height) {
                stillHovering = true
                break
              }
            }
            if (!stillHovering) {
              hoveredTrackIndex = null
            }
          }
          
          // On desktop: Draw MUTE/UNMUTE button below tracks (right-aligned)
          if (!isMobile) {
            // Add line break before MUTE/UNMUTE button
            y += lineHeight
            
            const muteMultiplier = getMuteTransitionMultiplier()
            const displayText = isMuted ? "UNMUTE" : "MUTE"
            const textWidth = measureText(displayText)
            const textX = p.width - 10 - textWidth // Right-aligned like durations
            const textY = y
            
            // Set up clickable area
            muteClickArea = {
              x: textX - 5,
              y: textY - textSize + 5,
              width: textWidth + 10,
              height: lineHeight
            }
            
            // Draw MUTE/UNMUTE text
            p.fill(0)
            p.text(displayText, textX, textY)
          }
        }

        p.mousePressed = async () => {
          // Check if clicking on metadata (email, phone, IG)
          for (let area of metadataClickAreas) {
            if (p.mouseX >= area.x && p.mouseX <= area.x + area.width &&
                p.mouseY >= area.y && p.mouseY <= area.y + area.height) {
              console.log(`Clicked on ${area.type}`)
              
              if (area.type === 'email') {
                window.open('mailto:info@matteobogoni.com', '_blank')
              } else if (area.type === 'phone') {
                window.open('tel:+393490867743', '_blank')
              } else if (area.type === 'ig') {
                window.open('https://instagram.com/matteobogoni', '_blank')
              }
              
              return
            }
          }
          
          // Check if clicking on MUTE/UNMUTE button
          if (muteClickArea) {
            if (p.mouseX >= muteClickArea.x && p.mouseX <= muteClickArea.x + muteClickArea.width &&
                p.mouseY >= muteClickArea.y && p.mouseY <= muteClickArea.y + muteClickArea.height) {
              console.log('Clicked on MUTE/UNMUTE')
              
              // If audio hasn't started, start the first track
              if (!audioStarted) {
                await initializeAudioPlayback()
                selectedTrackIndex = 0
                updateSelectedTrackIndex(0)
                loadTrack(0, true)
                audioStarted = true
                isMuted = false // Ensure not muted when starting
              } else {
                // If audio has started, toggle mute/unmute
                toggleMute()
              }
              
              return
            }
          }
          
          // Check if clicking on a track
          for (let area of trackClickAreas) {
            if (p.mouseX >= area.x && p.mouseX <= area.x + area.width &&
                p.mouseY >= area.y && p.mouseY <= area.y + area.height) {
              console.log(`Clicked on track ${area.trackIndex}`)
              
              // Set active track (only if switching to a different track)
              if (activeTrackIndex !== area.trackIndex) {
                activeTrackIndex = area.trackIndex
                trackStartTime = p.millis()
                // Lock the current hover color if hovering this track, otherwise generate a new one
                if (hoveredTrackIndex === area.trackIndex) {
                  activeTrackColor = hoverBoxColor
                } else {
                  activeTrackColor = getRandomHoverColor()
                }
                // Clear progress box immediately when switching tracks
                updateProgressBox(false, 0, 0, 0)
              }
              
              // If audio hasn't started yet, initialize it and start the selected track
              if (!audioStarted) {
                await initializeAudioPlayback()
                // After initializing, start the clicked track
                selectedTrackIndex = area.trackIndex
                updateSelectedTrackIndex(area.trackIndex)
                loadTrack(area.trackIndex, true)
                // Mark audio as started after loading the track
                audioStarted = true
                isMuted = false // Ensure not muted when starting
              } else {
                // If muted, directly switch to the new track without transition
                // (since there's no audio playing to transition from)
                if (isMuted) {
                  isMuted = false // Unmute
                  // Clear progress box immediately when switching tracks
                  updateProgressBox(false, 0, 0, 0)
                  // Stop current track if it exists
                  if (song) {
                    try {
                      song.stop()
                      song.dispose()
                    } catch (e) {
                      // Ignore errors
                    }
                    song = null
                  }
                  // Clear spectrum
                  spectrum.fill(0)
                  // Load and play the new track directly
                  selectedTrackIndex = area.trackIndex
                  updateSelectedTrackIndex(area.trackIndex)
                  loadTrack(area.trackIndex, true)
                } else {
                  // If audio is already started and playing, start transition to the clicked track
                  startTransition(area.trackIndex)
                }
              }
              
              return
            }
          }
        }

        // Function to properly initialize audio playback
        const initializeAudioPlayback = async () => {
          try {
            console.log('Initializing audio playback...')
            
            // Initialize Web Audio API context
            if (typeof window !== 'undefined' && window.AudioContext) {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
              if (audioContext.state === 'suspended') {
                await audioContext.resume()
                console.log('Web Audio API context resumed')
              }
            }

            // Initialize p5.sound audio context if available
            if (window.p5 && window.p5.soundOut && window.p5.soundOut.context) {
              const p5AudioContext = window.p5.soundOut.context
              if (p5AudioContext.state === 'suspended') {
                await p5AudioContext.resume()
                console.log('p5.sound audio context resumed')
              }
            }
            
            console.log('Audio contexts initialized')
          } catch (error) {
            console.error('Error initializing audio playback:', error)
          }
        }

        // Function to load and play the first track
        const loadAndPlayFirstTrack = async () => {
          try {
            console.log('Loading first track...')
            loadTrack(0, true)
            
            // Wait for the track to load
            let attempts = 0
            const maxAttempts = 10
            
            const waitForTrackToLoad = () => {
              return new Promise<void>((resolve) => {
                const checkLoaded = () => {
                  attempts++
                  if (song && song.isLoaded()) {
                    console.log('Track loaded, marking audio as started...')
                    // Don't play here since loadTrack(0, true) already handles playing
                    audioStarted = true
                    console.log('First track ready and audio started')
                    resolve()
                  } else if (attempts < maxAttempts) {
                    setTimeout(checkLoaded, 200)
                  } else {
                    console.error('Track failed to load after max attempts')
                    resolve()
                  }
                }
                checkLoaded()
              })
            }
            
            await waitForTrackToLoad()
          } catch (error) {
            console.error('Error loading first track:', error)
          }
        }

        // Expose track switching function
        window.switchTrack = async (trackIndex: number) => {
          const maxTracks = tracks.length > 0 ? tracks.length : 3
          if (trackIndex >= 0 && trackIndex < maxTracks) {
            console.log(`Switching to track ${trackIndex}`)
            
            // Start transition immediately with track index
            if (audioStarted) {
              startTransition(trackIndex)
            } else {
              // If audio hasn't started yet, just switch immediately
              // Clear progress box immediately when switching tracks
              updateProgressBox(false, 0, 0, 0)
              selectedTrackIndex = trackIndex
              updateSelectedTrackIndex(trackIndex)
              loadTrack(trackIndex, audioStarted)
            }
          }
        }
      }

      try {
        p5InstanceRef.current = new p5(sketch)
        console.log('✅ p5 sketch created successfully')
        setDebugInfo(prev => ({ ...prev, p5Ready: true }))
      } catch (error) {
        console.error('❌ Error creating p5 sketch:', error)
        setDebugInfo(prev => ({ ...prev, p5Ready: false }))
      }
    }

      loadP5()
    }, 100) // 100ms delay to ensure component is mounted

    return () => {
      clearTimeout(timer)
      // Stop any playing audio before cleanup
      if (p5InstanceRef.current && p5InstanceRef.current.song) {
        p5InstanceRef.current.song.stop()
        p5InstanceRef.current.song.dispose()
      }
      
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove()
      }
    }
  }, [tracks])

  // Handle track clicks
  const handleTrackClick = (index: number) => {
    console.log(`Track clicked: ${index}`)
    setSelectedTrackIndex(index)
    if (window.switchTrack) {
      window.switchTrack(index)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', margin: 0, padding: 0 }}>
      {/* p5.js canvas container */}
      <div ref={containerRef} className="w-full h-full" style={{ position: 'relative', zIndex: 1 }}>
      </div>
      
      {/* Hover box - positioned above canvas */}
      {hoverBoxState && hoverBoxState.visible && (
        <div
          style={{
            position: 'absolute',
            top: `${hoverBoxState.y}px`,
            left: '-10vw',
            width: '120vw',
            height: `${hoverBoxState.height}px`,
            background: hoverBoxState.color,
            mixBlendMode: 'difference',
            filter: 'blur(4.5px)',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Progress box - positioned above canvas, on top of hover box */}
      {progressBoxState && progressBoxState.visible && (
        <div
          style={{
            position: 'absolute',
            top: `${progressBoxState.y}px`,
            left: 0,
            width: `${progressBoxState.width}px`,
            height: `${progressBoxState.height}px`,
            background: '#FFF',
            mixBlendMode: 'difference',
            filter: 'blur(4.5px)',
            zIndex: 11,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  )
}
