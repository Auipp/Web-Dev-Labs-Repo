/**
 * Abatron 803 (WEBDEV CSE343) Vintage Pocket Calculator Logic & LED Display
 *
 * Features:
 * - Authentic 9-cell (1 status/sign slot + 8 digit slots) red 7-segment SVG LED display
 * - Starts displaying "12345678" matching REFERENCE IMAGE TO IMITATE.jpg, and immediately
 *   transitions into live calculation on any digit/key press
 * - Full 4-function arithmetic (+, -, ×, ÷), chained operations, repeated "=" evaluation,
 *   and decimal point entry
 * - "K" button acts as Backspace while actively typing digits, or toggles/locks Constant (K)
 *   mode when an operator/result is present (authentic to the Abatron 803)
 * - Tactile mechanical click sound synthesized via Web Audio API + full keyboard support
 */

(() => {
  'use strict';

  const MAX_DIGITS = 8;
  const NUM_CELLS = 9; // Cell 0: Sign / Constant indicator, Cells 1..8: 8 numeric digits

  // 7-segment bitmask table: [a, b, c, d, e, f, g]
  const SEGMENT_MAP = {
    ' ': [0, 0, 0, 0, 0, 0, 0],
    '0': [1, 1, 1, 1, 1, 1, 0],
    '1': [0, 1, 1, 0, 0, 0, 0],
    '2': [1, 1, 0, 1, 1, 0, 1],
    '3': [1, 1, 1, 1, 0, 0, 1],
    '4': [0, 1, 1, 0, 0, 1, 1],
    '5': [1, 0, 1, 1, 0, 1, 1],
    '6': [1, 0, 1, 1, 1, 1, 1],
    '7': [1, 1, 1, 0, 0, 0, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
    '-': [0, 0, 0, 0, 0, 0, 1],
    'E': [1, 0, 0, 1, 1, 1, 1],
    'r': [0, 0, 0, 0, 1, 0, 1],
    'c': [0, 0, 0, 1, 1, 0, 1],
  };

  // Calculator state
  const state = {
    displayValue: '12345678', // Matches reference image on initial load
    isInitialDemo: true,      // Clears automatically on first digit press
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
    lastOperator: null,
    lastOperand: null,
    constantMode: false,
    constantOperator: null,
    constantValue: null,
    error: false,
  };

  const ledStrip = document.getElementById('led-strip');
  const kButton = document.querySelector('.key-k');

  // Build the 9 seven-segment SVG cells inside #led-strip
  const cells = [];

  function initLedDisplay() {
    ledStrip.innerHTML = '';
    for (let i = 0; i < NUM_CELLS; i++) {
      const cell = document.createElement('div');
      cell.className = 'led-cell';

      // Slanted vintage 7-segment geometry (viewBox 0 0 62 96)
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 62 96');
      svg.setAttribute('class', 'led-svg');

      // Group with slight 7-degree italic slant typical of 1970s bubble LED modules
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('transform', 'skewX(-7) translate(6, 0)');

      const polygons = {
        a: '10,6 42,6 37,14 15,14',
        b: '44,8 48,13 48,43 43,46 39,41 39,15',
        c: '43,50 48,54 48,83 44,88 39,81 39,55',
        d: '15,82 37,82 42,90 10,90',
        e: '8,50 13,55 13,81 8,88 4,83 4,54',
        f: '8,8 13,15 13,41 9,46 4,43 4,13',
        g: '10,48 15,43 37,43 42,48 37,53 15,53',
      };

      const segEls = {};
      for (const [segName, points] of Object.entries(polygons)) {
        const poly = document.createElementNS(svgNS, 'polygon');
        poly.setAttribute('points', points);
        poly.setAttribute('class', `seg seg-${segName}`);
        g.appendChild(poly);
        segEls[segName] = poly;
      }

      // Decimal point (bottom-right)
      const dp = document.createElementNS(svgNS, 'circle');
      dp.setAttribute('cx', '54');
      dp.setAttribute('cy', '86');
      dp.setAttribute('r', '4.6');
      dp.setAttribute('class', 'seg-dp');
      g.appendChild(dp);

      // Leftmost cell also includes a top-left Constant (K) indicator dot
      let kDot = null;
      if (i === 0) {
        kDot = document.createElementNS(svgNS, 'circle');
        kDot.setAttribute('cx', '10');
        kDot.setAttribute('cy', '14');
        kDot.setAttribute('r', '4.5');
        kDot.setAttribute('class', 'seg-k-indicator');
        g.appendChild(kDot);
      }

      svg.appendChild(g);
      cell.appendChild(svg);
      ledStrip.appendChild(cell);

      cells.push({ segEls, dp, kDot });
    }
  }

  /**
   * Renders the current calculator state onto the 9-cell 7-segment display.
   * Cell 0 displays "-" (if negative) or "E" (if error) plus the Constant (K) indicator.
   * Cells 1..8 display up to 8 right-aligned digits with attached decimal points.
   */
  function updateDisplay() {
    const raw = state.displayValue;
    ledStrip.setAttribute('aria-label', state.error ? 'Error' : raw);

    if (kButton) {
      kButton.classList.toggle('is-locked-k', state.constantMode);
    }

    // Clear all segments first
    for (let i = 0; i < NUM_CELLS; i++) {
      const { segEls, dp, kDot } = cells[i];
      Object.values(segEls).forEach((el) => el.classList.remove('on'));
      dp.classList.remove('on');
      if (kDot) {
        kDot.classList.toggle('on', state.constantMode);
      }
    }

    if (state.error) {
      // Show "E" in cell 0 and "0." in cell 8 like classic 8-digit pocket calculators
      setCellChar(0, 'E', false);
      setCellChar(8, '0', true);
      return;
    }

    const isNegative = raw.startsWith('-');
    const cleanStr = isNegative ? raw.slice(1) : raw;

    // Parse into [{ char, hasDp }] tokens (max 8 digits)
    const tokens = [];
    for (let i = 0; i < cleanStr.length; i++) {
      const ch = cleanStr[i];
      if (ch === '.') {
        if (tokens.length > 0) {
          tokens[tokens.length - 1].hasDp = true;
        } else {
          tokens.push({ char: '0', hasDp: true });
        }
      } else {
        tokens.push({ char: ch, hasDp: false });
      }
    }

    // Ensure a trailing decimal point is always shown on the rightmost digit on vintage calculators
    const displayTokens = tokens.slice(0, MAX_DIGITS);
    const startCell = NUM_CELLS - displayTokens.length; // Right-aligned into cells 1..8

    // Place negative sign either in the cell immediately to the left of the first digit, or cell 0
    if (isNegative) {
      const signCell = Math.max(0, startCell - 1);
      setCellChar(signCell, '-', false);
    }

    for (let i = 0; i < displayTokens.length; i++) {
      const targetIdx = startCell + i;
      if (targetIdx >= 0 && targetIdx < NUM_CELLS) {
        setCellChar(targetIdx, displayTokens[i].char, displayTokens[i].hasDp);
      }
    }
  }

  function setCellChar(cellIndex, ch, hasDp) {
    const cell = cells[cellIndex];
    if (!cell) return;
    const mask = SEGMENT_MAP[ch] || SEGMENT_MAP[' '];
    const segKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (let i = 0; i < 7; i++) {
      cell.segEls[segKeys[i]].classList.toggle('on', Boolean(mask[i]));
    }
    cell.dp.classList.toggle('on', Boolean(hasDp));
  }

  // Synthesize a subtle, realistic vintage plastic switch click via Web Audio API
  let audioCtx = null;
  function playKeyClick(isOrangeKey = false) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isOrangeKey ? 210 : 175, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.022);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch (_) {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  // Helper: count only numeric digits (0-9) in a display string
  function countDigits(str) {
    return str.replace(/[^0-9]/g, '').length;
  }

  // Format a numeric result to fit within an 8-digit vintage calculator display
  function formatResult(num) {
    if (!Number.isFinite(num)) {
      state.error = true;
      return 'E';
    }

    // Eliminate IEEE 754 floating-point noise (e.g. 0.1 + 0.2 = 0.30000000000000004)
    const rounded12 = Number(Math.round(Number(num + 'e10')) + 'e-10');
    const absVal = Math.abs(rounded12);

    if (absVal >= 1e8) {
      state.error = true;
      return 'E';
    }

    if (absVal > 0 && absVal < 1e-7) {
      return '0';
    }

    const sign = rounded12 < 0 ? '-' : '';
    const intPartStr = Math.trunc(absVal).toString();
    const maxFracDigits = Math.max(0, MAX_DIGITS - intPartStr.length);

    let formatted = absVal.toFixed(maxFracDigits);
    if (formatted.includes('.')) {
      formatted = formatted.replace(/\.?0+$/, '');
    }

    if (formatted === '0') {
      return '0';
    }

    return sign + formatted;
  }

  function compute(a, b, op) {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        if (b === 0) return NaN;
        return a / b;
      default:
        return b;
    }
  }

  function inputDigit(digit) {
    if (state.error) {
      clearAll();
    }

    if (state.isInitialDemo) {
      state.displayValue = digit;
      state.isInitialDemo = false;
      state.waitingForSecondOperand = false;
      updateDisplay();
      return;
    }

    if (state.waitingForSecondOperand) {
      state.displayValue = digit;
      state.waitingForSecondOperand = false;
    } else {
      if (countDigits(state.displayValue) >= MAX_DIGITS) {
        return; // 8-digit limit reached
      }
      state.displayValue =
        state.displayValue === '0' ? digit : state.displayValue + digit;
    }

    updateDisplay();
  }

  function inputDecimal() {
    if (state.error) {
      clearAll();
    }

    if (state.isInitialDemo || state.waitingForSecondOperand) {
      state.displayValue = '0.';
      state.isInitialDemo = false;
      state.waitingForSecondOperand = false;
      updateDisplay();
      return;
    }

    if (!state.displayValue.includes('.')) {
      if (countDigits(state.displayValue) >= MAX_DIGITS) {
        return;
      }
      state.displayValue += '.';
      updateDisplay();
    }
  }

  function handleOperator(nextOperator) {
    if (state.error) return;

    state.isInitialDemo = false;
    const inputValue = parseFloat(state.displayValue);

    // If user changes operator before typing the second number
    if (state.operator && state.waitingForSecondOperand) {
      state.operator = nextOperator;
      if (state.constantMode) {
        state.constantOperator = nextOperator;
        state.constantValue = state.firstOperand;
      }
      return;
    }

    if (state.firstOperand === null) {
      state.firstOperand = inputValue;
    } else if (state.operator) {
      const result = compute(state.firstOperand, inputValue, state.operator);
      const formatted = formatResult(result);
      state.displayValue = formatted;
      state.firstOperand = state.error ? null : parseFloat(formatted);
    }

    state.waitingForSecondOperand = true;
    state.operator = nextOperator;
    state.lastOperator = null;
    state.lastOperand = null;

    if (state.constantMode) {
      state.constantOperator = nextOperator;
      state.constantValue = state.firstOperand;
    }

    updateDisplay();
  }

  function handleEquals() {
    if (state.error) return;
    state.isInitialDemo = false;

    const currentValue = parseFloat(state.displayValue);

    if (state.operator !== null) {
      // Standard calculation: firstOperand [op] currentValue
      const secondOperand = state.waitingForSecondOperand
        ? state.firstOperand
        : currentValue;

      // In Abatron 803 constant mode, locking K stores the constant operand
      if (state.constantMode) {
        state.constantOperator = state.operator;
        state.constantValue =
          state.operator === '*' ? state.firstOperand : secondOperand;
      }

      const result = compute(state.firstOperand, secondOperand, state.operator);
      const formatted = formatResult(result);
      state.displayValue = formatted;
      state.firstOperand = null;
      state.lastOperator = state.operator;
      state.lastOperand = secondOperand;
      state.operator = null;
      state.waitingForSecondOperand = true;
    } else if (state.constantMode && state.constantOperator !== null && state.constantValue !== null) {
      // Constant (K) mode repeat calculation on current number
      const result = compute(currentValue, state.constantValue, state.constantOperator);
      const formatted = formatResult(result);
      state.displayValue = formatted;
      state.waitingForSecondOperand = true;
    } else if (state.lastOperator !== null && state.lastOperand !== null) {
      // Repeat last "=" operation
      const result = compute(currentValue, state.lastOperand, state.lastOperator);
      const formatted = formatResult(result);
      state.displayValue = formatted;
      state.waitingForSecondOperand = true;
    }

    updateDisplay();
  }

  /**
   * Handles the "K" button:
   * - While actively typing a multi-digit number, acts as Backspace (deletes last character)
   * - Otherwise toggles vintage Constant (K) mode (locking the active operator/operand)
   */
  function handleKButton() {
    if (state.error) {
      clearAll();
      return;
    }

    if (state.isInitialDemo) {
      state.displayValue = '0';
      state.isInitialDemo = false;
      updateDisplay();
      return;
    }

    const isActivelyTyping = !state.waitingForSecondOperand && state.displayValue !== '0';

    if (isActivelyTyping) {
      if (state.displayValue.length > 1) {
        state.displayValue = state.displayValue.slice(0, -1);
        if (state.displayValue === '-' || state.displayValue === '') {
          state.displayValue = '0';
        }
      } else {
        state.displayValue = '0';
      }
      updateDisplay();
      return;
    }

    // Toggle Constant (K) lock mode when not mid-typing
    state.constantMode = !state.constantMode;
    if (state.constantMode) {
      state.constantValue = parseFloat(state.displayValue);
      if (state.operator) {
        state.constantOperator = state.operator;
      } else if (state.lastOperator) {
        state.constantOperator = state.lastOperator;
      }
    } else {
      state.constantOperator = null;
      state.constantValue = null;
    }
    updateDisplay();
  }

  function clearAll() {
    state.displayValue = '0';
    state.isInitialDemo = false;
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecondOperand = false;
    state.lastOperator = null;
    state.lastOperand = null;
    state.error = false;
    updateDisplay();
  }

  // Attach click handlers to all 18 calculator buttons
  const buttons = document.querySelectorAll('.calc-key');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const digit = btn.getAttribute('data-digit');
      const operator = btn.getAttribute('data-operator');
      const action = btn.getAttribute('data-action');

      playKeyClick(btn.classList.contains('key-orange'));

      if (digit !== null) {
        inputDigit(digit);
      } else if (operator !== null) {
        handleOperator(operator);
      } else if (action === 'decimal') {
        inputDecimal();
      } else if (action === 'equals') {
        handleEquals();
      } else if (action === 'clear') {
        clearAll();
      } else if (action === 'k') {
        handleKButton();
      }
    });
  });

  // Physical keyboard support with synchronized visual button depression
  const keyMap = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '.': '.',
    ',': '.',
    '+': '+',
    '-': '-',
    '*': '*',
    'x': '*',
    'X': '*',
    '/': '/',
    '=': '=',
    'Enter': '=',
    'Escape': 'c',
    'c': 'c',
    'C': 'c',
    'Delete': 'c',
    'Backspace': 'k',
    'k': 'k',
    'K': 'k',
  };

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const mapped = keyMap[e.key];
    if (!mapped) return;

    e.preventDefault();
    const targetBtn = document.querySelector(`.calc-key[data-key="${mapped}"]`);
    if (targetBtn) {
      targetBtn.classList.add('is-pressed');
      targetBtn.click();
    }
  });

  window.addEventListener('keyup', (e) => {
    const mapped = keyMap[e.key];
    if (!mapped) return;
    const targetBtn = document.querySelector(`.calc-key[data-key="${mapped}"]`);
    if (targetBtn) {
      targetBtn.classList.remove('is-pressed');
    }
  });

  // Initialize display on load
  initLedDisplay();
  updateDisplay();
})();
