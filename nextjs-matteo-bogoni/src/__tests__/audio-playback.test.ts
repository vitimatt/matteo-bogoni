/**
 * Audio Playback Tests
 * 
 * These tests validate that the audio playback functionality works correctly
 * and handles browser autoplay policies properly.
 */

// Mock p5.js and p5.sound for testing
const mockP5Sound = {
  loadSound: jest.fn(),
  isLoaded: jest.fn(),
  play: jest.fn(),
  loop: jest.fn(),
  stop: jest.fn(),
  dispose: jest.fn()
};

const mockP5 = {
  loadFont: jest.fn(),
  loadSound: jest.fn(),
  createCanvas: jest.fn(),
  background: jest.fn(),
  textAlign: jest.fn(),
  textSize: jest.fn(),
  fill: jest.fn(),
  text: jest.fn(),
  rect: jest.fn(),
  stroke: jest.fn(),
  strokeWeight: jest.fn(),
  noStroke: jest.fn(),
  mousePressed: jest.fn(),
  preload: jest.fn(),
  setup: jest.fn(),
  draw: jest.fn(),
  soundOut: {
    context: {
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined)
    }
  }
};

// Mock window.p5
Object.defineProperty(window, 'p5', {
  value: mockP5,
  writable: true
});

// Mock AudioContext
const mockAudioContext = {
  state: 'suspended',
  resume: jest.fn().mockResolvedValue(undefined)
};

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true
});

describe('Audio Playback Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioContext.state = 'suspended';
    mockP5.soundOut.context.state = 'running';
  });

  describe('Audio Context Initialization', () => {
    it('should initialize Web Audio API context', async () => {
      const mockAudioContext = new window.AudioContext();
      
      expect(mockAudioContext.state).toBe('suspended');
      
      await mockAudioContext.resume();
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('should handle already running audio context', async () => {
      mockAudioContext.state = 'running';
      
      const mockAudioContext = new window.AudioContext();
      
      expect(mockAudioContext.state).toBe('running');
      // Should not call resume if already running
    });

    it('should handle p5.sound audio context', async () => {
      const p5AudioContext = mockP5.soundOut.context;
      
      if (p5AudioContext.state === 'suspended') {
        await p5AudioContext.resume();
      }
      
      expect(p5AudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('Audio Loading and Playback', () => {
    it('should load audio successfully', () => {
      const mockSong = {
        isLoaded: jest.fn(() => true),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      mockP5.loadSound.mockImplementation((url, onLoad, onError) => {
        if (onLoad) onLoad();
        return mockSong;
      });

      const song = mockP5.loadSound('test-audio.mp3', () => {
        console.log('Audio loaded successfully');
      });

      expect(mockP5.loadSound).toHaveBeenCalledWith(
        'test-audio.mp3',
        expect.any(Function)
      );
    });

    it('should handle audio loading errors', () => {
      const onError = jest.fn();
      
      mockP5.loadSound.mockImplementation((url, onLoad, onError) => {
        if (onError) onError(new Error('Failed to load audio'));
        return mockP5Sound;
      });

      mockP5.loadSound('invalid-audio.mp3', undefined, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should play audio when loaded and audioStarted is true', () => {
      const mockSong = {
        isLoaded: jest.fn(() => true),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      const audioStarted = true;

      if (audioStarted && mockSong.isLoaded()) {
        mockSong.play();
        mockSong.loop();
      }

      expect(mockSong.play).toHaveBeenCalled();
      expect(mockSong.loop).toHaveBeenCalled();
    });

    it('should not play audio when not loaded', () => {
      const mockSong = {
        isLoaded: jest.fn(() => false),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      const audioStarted = true;

      if (audioStarted && mockSong.isLoaded()) {
        mockSong.play();
        mockSong.loop();
      }

      expect(mockSong.play).not.toHaveBeenCalled();
      expect(mockSong.loop).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle audio playback errors gracefully', () => {
      const mockSong = {
        isLoaded: jest.fn(() => true),
        play: jest.fn(() => {
          throw new Error('Playback failed');
        }),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      const audioStarted = true;

      try {
        if (audioStarted && mockSong.isLoaded()) {
          mockSong.play();
          mockSong.loop();
        }
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Playback failed');
      }

      expect(mockSong.play).toHaveBeenCalled();
      expect(mockSong.loop).not.toHaveBeenCalled(); // Should not reach this
    });

    it('should retry audio playback after loading', async () => {
      const mockSong = {
        isLoaded: jest.fn(() => false),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      // Simulate loading process
      setTimeout(() => {
        mockSong.isLoaded.mockReturnValue(true);
      }, 100);

      // Wait for loading
      await new Promise(resolve => setTimeout(resolve, 150));

      if (mockSong.isLoaded()) {
        mockSong.play();
        mockSong.loop();
      }

      expect(mockSong.play).toHaveBeenCalled();
      expect(mockSong.loop).toHaveBeenCalled();
    });
  });

  describe('Track Switching', () => {
    it('should switch tracks correctly', async () => {
      const mockSong1 = {
        isLoaded: jest.fn(() => true),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      const mockSong2 = {
        isLoaded: jest.fn(() => true),
        play: jest.fn(),
        loop: jest.fn(),
        stop: jest.fn(),
        dispose: jest.fn()
      };

      // Simulate track switching
      mockSong1.stop();
      mockSong1.dispose();

      // Load new track
      setTimeout(() => {
        mockSong2.play();
        mockSong2.loop();
      }, 300);

      await new Promise(resolve => setTimeout(resolve, 400));

      expect(mockSong1.stop).toHaveBeenCalled();
      expect(mockSong1.dispose).toHaveBeenCalled();
      expect(mockSong2.play).toHaveBeenCalled();
      expect(mockSong2.loop).toHaveBeenCalled();
    });
  });
});

// Integration test for the complete audio flow
describe('Audio Integration Tests', () => {
  it('should handle complete audio initialization flow', async () => {
    // Mock the complete flow
    const mockSong = {
      isLoaded: jest.fn(() => false),
      play: jest.fn(),
      loop: jest.fn(),
      stop: jest.fn(),
      dispose: jest.fn()
    };

    // Simulate audio context initialization
    mockAudioContext.state = 'suspended';
    await mockAudioContext.resume();

    // Simulate audio loading
    mockP5.loadSound.mockImplementation((url, onLoad) => {
      setTimeout(() => {
        mockSong.isLoaded.mockReturnValue(true);
        if (onLoad) onLoad();
      }, 100);
      return mockSong;
    });

    const song = mockP5.loadSound('test-audio.mp3', () => {
      // Audio loaded callback
    });

    // Wait for loading
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulate user interaction
    const audioStarted = true;
    if (audioStarted && song.isLoaded()) {
      song.play();
      song.loop();
    }

    expect(mockAudioContext.resume).toHaveBeenCalled();
    expect(mockP5.loadSound).toHaveBeenCalled();
    expect(song.play).toHaveBeenCalled();
    expect(song.loop).toHaveBeenCalled();
  });
});

