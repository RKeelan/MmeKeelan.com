import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock canvas and its context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  canvas: { width: 300, height: 300 }
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  width: 300,
  height: 300,
  addEventListener: vi.fn()
};

const mockWordsInput = {
  value: 'apple, banana, cherry',
  addEventListener: vi.fn()
};

const mockSpinButton = { addEventListener: vi.fn() };
const mockStartButton = { addEventListener: vi.fn() };
const mockStopButton = { addEventListener: vi.fn() };

// Mock Image constructor
class MockImage {
  constructor() {
    this.onload = null;
    this.src = '';
    this.width = 20;
    this.height = 20;
    this.angle = 0;
  }
}

describe('Roulette Wheel', () => {
  beforeEach(async () => {
    // Reset context mocks but preserve event listener mocks
    mockContext.clearRect.mockClear();
    mockContext.beginPath.mockClear();
    mockContext.moveTo.mockClear();
    mockContext.arc.mockClear();
    mockContext.fill.mockClear();
    mockContext.stroke.mockClear();
    mockContext.save.mockClear();
    mockContext.translate.mockClear();
    mockContext.rotate.mockClear();
    mockContext.drawImage.mockClear();
    mockContext.restore.mockClear();
    mockContext.fillText.mockClear();
    
    // Mock global objects
    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    
    // Mock document.getElementById
    vi.stubGlobal('document', {
      getElementById: vi.fn((id) => {
        switch (id) {
          case 'wheel': return mockCanvas;
          case 'wordsInput': return mockWordsInput;
          case 'spin': return mockSpinButton;
          case 'start': return mockStartButton;
          case 'stop': return mockStopButton;
          default: return null;
        }
      })
    });

    // Reset module state
    vi.resetModules();
    
    // Import the module after mocks are set up
    await import('./roulette.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize canvas and draw wheel on module load', () => {
    expect(document.getElementById).toHaveBeenCalledWith('wheel');
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should set up event listeners for all buttons', () => {
    expect(mockSpinButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockStartButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockStopButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockWordsInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
  });

  it('should update wheel when input changes', () => {
    // Find the input event listener
    const inputEventCall = mockWordsInput.addEventListener.mock.calls.find(
      call => call[0] === 'input'
    );
    expect(inputEventCall).toBeDefined();
    
    // Clear previous calls from initialization but keep the listener reference
    mockContext.clearRect.mockClear();
    mockContext.beginPath.mockClear();
    
    // Change the input value
    mockWordsInput.value = 'red, blue, green, yellow';
    
    const inputHandler = inputEventCall?.[1];
    inputHandler();
    
    // Should redraw the wheel
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
  });

  it('should start spinning when spin button is clicked', () => {
    // Find and trigger the spin button click
    const spinEventCall = mockSpinButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    );
    expect(spinEventCall).toBeDefined();
    
    const spinHandler = spinEventCall?.[1];
    spinHandler();
    
    // Should start animation
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should start continuous spinning when start button is clicked', () => {
    // Find and trigger the start button click
    const startEventCall = mockStartButton.addEventListener.mock.calls.find(
      call => call[0] === 'click'
    );
    expect(startEventCall).toBeDefined();
    
    const startHandler = startEventCall?.[1];
    startHandler();
    
    // Should start animation
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should parse input text into word list correctly', () => {
    // Get the input handler once, outside the loop
    const inputEventCall = mockWordsInput.addEventListener.mock.calls.find(
      call => call[0] === 'input'
    );
    expect(inputEventCall).toBeDefined();
    const inputHandler = inputEventCall?.[1];

    // Test with different input formats
    const testCases = [
      { input: 'apple, banana, cherry', expected: 3 },
      { input: 'apple banana cherry', expected: 1 }, // spaces no longer split
      { input: 'apple,banana,cherry', expected: 3 },
      { input: 'apple  ,  banana  ,  cherry', expected: 3 }, // spaces around commas are trimmed
      { input: '', expected: 0 },
      { input: 'single', expected: 1 },
      { input: 'item with spaces, another item', expected: 2 } // spaces within items preserved
    ];

    testCases.forEach(({ input, expected }) => {
      mockWordsInput.value = input;
      
      // Clear context mocks before each test case
      mockContext.beginPath.mockClear();
      
      inputHandler();
      
      // The number of sections drawn should match the expected word count
      if (expected > 0) {
        expect(mockContext.beginPath).toHaveBeenCalledTimes(expected);
      }
    });
  });

  it('should handle image loading and draw arrow', () => {
    // The module creates an Image instance and sets up onload
    // We need to simulate this differently since the image is created in the module
    // Let's just verify that drawImage gets called during drawing operations
    
    // Clear previous calls
    mockContext.drawImage.mockClear();
    
    // Find and trigger a drawing operation (like input change)
    const inputEventCall = mockWordsInput.addEventListener.mock.calls.find(
      call => call[0] === 'input'
    );
    const inputHandler = inputEventCall?.[1];
    inputHandler();
    
    // The arrow should be drawn as part of the redraw
    expect(mockContext.drawImage).toHaveBeenCalled();
  });
});
