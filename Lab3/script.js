const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const keypadElement = document.getElementById('keypad');
const operatorButtons = document.querySelectorAll('.btn-blue[data-action="operator"]');

let currentOperand = '0';
let previousOperand = '';
let currentOperator = null;
let shouldResetScreen = false;

function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        return null;
    }
    return a / b;
}

function operate(operator, a, b) {
    const numA = Number(a);
    const numB = Number(b);
    switch (operator) {
        case '+':
            return add(numA, numB);
        case '−':
        case '-':
            return subtract(numA, numB);
        case '×':
        case '*':
            return multiply(numA, numB);
        case '÷':
        case '/':
            return divide(numA, numB);
        default:
            return null;
    }
}

function roundResult(number) {
    return Math.round(number * 1000000000) / 1000000000;
}

function updateDisplay() {
    currentOperandElement.textContent = currentOperand;
    if (currentOperator !== null) {
        previousOperandElement.textContent = `${previousOperand} ${currentOperator}`;
    } else {
        previousOperandElement.textContent = previousOperand;
    }

    if (currentOperand.length > 9) {
        currentOperandElement.style.fontSize = '28px';
    } else if (currentOperand.length > 6) {
        currentOperandElement.style.fontSize = '38px';
    } else {
        currentOperandElement.style.fontSize = '48px';
    }
}

function clearOperatorHighlights() {
    operatorButtons.forEach((btn) => btn.classList.remove('active'));
}

function highlightOperator(operator) {
    clearOperatorHighlights();
    operatorButtons.forEach((btn) => {
        if (btn.dataset.value === operator) {
            btn.classList.add('active');
        }
    });
}

function appendNumber(number) {
    if (currentOperand === '0' || shouldResetScreen) {
        currentOperand = number;
        shouldResetScreen = false;
    } else {
        if (currentOperand.length >= 12) {
            return;
        }
        currentOperand += number;
    }
    clearOperatorHighlights();
    updateDisplay();
}

function appendDecimal() {
    if (shouldResetScreen) {
        currentOperand = '0.';
        shouldResetScreen = false;
        clearOperatorHighlights();
        updateDisplay();
        return;
    }
    if (!currentOperand.includes('.')) {
        currentOperand += '.';
    }
    clearOperatorHighlights();
    updateDisplay();
}

function toggleSign() {
    if (currentOperand === '0' || currentOperand === 'Error') {
        return;
    }
    if (currentOperand.startsWith('-')) {
        currentOperand = currentOperand.slice(1);
    } else {
        currentOperand = '-' + currentOperand;
    }
    updateDisplay();
}

function clearAll() {
    currentOperand = '0';
    previousOperand = '';
    currentOperator = null;
    shouldResetScreen = false;
    clearOperatorHighlights();
    updateDisplay();
}

function calculatePercent() {
    if (currentOperand === 'Error') {
        return;
    }
    const value = Number(currentOperand);
    currentOperand = roundResult(value / 100).toString();
    clearOperatorHighlights();
    updateDisplay();
}

function deleteDigit() {
    if (currentOperand === 'Error' || shouldResetScreen) {
        return;
    }
    if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
        currentOperand = '0';
    } else {
        currentOperand = currentOperand.slice(0, -1);
    }
    updateDisplay();
}

function setOperator(operator) {
    if (currentOperand === 'Error') {
        return;
    }
    if (currentOperator !== null && !shouldResetScreen) {
        evaluate();
    }
    previousOperand = currentOperand;
    currentOperator = operator;
    shouldResetScreen = true;
    highlightOperator(operator);
    updateDisplay();
}

function evaluate() {
    if (currentOperator === null || shouldResetScreen) {
        return;
    }
    const result = operate(currentOperator, previousOperand, currentOperand);
    if (result === null) {
        currentOperand = 'Error';
        previousOperand = '';
        currentOperator = null;
        shouldResetScreen = true;
        clearOperatorHighlights();
        updateDisplay();
        return;
    }
    previousOperand = `${previousOperand} ${currentOperator} ${currentOperand} =`;
    currentOperand = roundResult(result).toString();
    currentOperator = null;
    shouldResetScreen = true;
    clearOperatorHighlights();
    updateDisplay();
}

keypadElement.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const value = button.dataset.value;

    if (!action) {
        appendNumber(value);
        return;
    }

    switch (action) {
        case 'clear':
            clearAll();
            break;
        case 'delete':
            deleteDigit();
            break;
        case 'percent':
            calculatePercent();
            break;
        case 'negate':
            toggleSign();
            break;
        case 'operator':
            setOperator(value);
            break;
        case 'decimal':
            appendDecimal();
            break;
        case 'calculate':
            evaluate();
            break;
    }
});

window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (key >= '0' && key <= '9') {
        appendNumber(key);
    } else if (key === '.') {
        appendDecimal();
    } else if (key === '=' || key === 'Enter') {
        event.preventDefault();
        evaluate();
    } else if (key === 'Backspace') {
        deleteDigit();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        clearAll();
    } else if (key === '+') {
        setOperator('+');
    } else if (key === '-') {
        setOperator('−');
    } else if (key === '*') {
        setOperator('×');
    } else if (key === '/') {
        event.preventDefault();
        setOperator('÷');
    } else if (key === '%') {
        calculatePercent();
    }
});
