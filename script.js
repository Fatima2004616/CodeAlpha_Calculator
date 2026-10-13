
document.addEventListener("DOMContentLoaded", () => {
  const expressionDisplay = document.getElementById("expression");
  const resultDisplay = document.getElementById("result");
  const keys = document.querySelector(".keys");

  let expression = "";
  let justCalculated = false;
  let errorMessage = "";

  const operators = ["+", "−", "×", "÷"];

  function formatNumber(number) {
    if (!Number.isFinite(number)) return "Error";
    if (Object.is(number, -0)) number = 0;

    return Number(number.toPrecision(12)).toLocaleString("en-US", {
      maximumFractionDigits: 10,
      useGrouping: false
    });
  }

  function tokenize(input) {
    const tokens = input.match(
      /(?:\d+\.?\d*|\.\d+)|[+\-×÷]/g
    );

    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
      throw new Error("Invalid expression");
    }

    return tokens;
  }

  function calculate(input) {
    const tokens = tokenize(input);
    let position = 0;

    function primary() {
      const token = tokens[position];

      if (token === "+" || token === "−") {
        position++;
        const value = primary();
        return token === "−" ? -value : value;
      }

      if (token === undefined || operators.includes(token)) {
        throw new Error("Incomplete expression");
      }

      position++;
      const value = Number(token);

      if (!Number.isFinite(value)) throw new Error("Invalid number");
      return value;
    }

    function term() {
      let value = primary();

      while (tokens[position] === "×" || tokens[position] === "÷") {
        const operator = tokens[position++];
        const next = primary();

        if (operator === "÷" && next === 0) {
          throw new Error("Cannot divide by zero");
        }

        value = operator === "×" ? value * next : value / next;
      }

      return value;
    }

    function sum() {
      let value = term();

      while (tokens[position] === "+" || tokens[position] === "−") {
        const operator = tokens[position++];
        const next = term();
        value = operator === "+" ? value + next : value - next;
      }

      return value;
    }

    const answer = sum();

    if (position !== tokens.length || !Number.isFinite(answer)) {
      throw new Error("Invalid calculation");
    }

    return answer;
  }

  function render() {
    expressionDisplay.textContent = expression || "Ready to calculate";

    if (errorMessage) {
      resultDisplay.textContent = errorMessage;
      return;
    }

    if (!expression || operators.includes(expression.slice(-1))) {
      resultDisplay.textContent = "0";
      return;
    }

    try {
      resultDisplay.textContent = formatNumber(calculate(expression));
    } catch {
      resultDisplay.textContent = "0";
    }
  }

  function clear() {
    expression = "";
    justCalculated = false;
    errorMessage = "";
    render();
  }

  function appendNumber(number) {
    errorMessage = "";

    if (justCalculated) {
      expression = "";
      justCalculated = false;
    }

    const lastNumber = expression.split(/[+−×÷]/).pop();

    if (number === "." && lastNumber.includes(".")) return;

    if (number === ".") {
      if (!lastNumber) expression += "0";
      else if (lastNumber === "-") expression += "0";
    }

    expression += number;
    render();
  }

  function appendOperator(operator) {
    errorMessage = "";

    if (!expression) {
      if (operator === "−") expression = "−";
      render();
      return;
    }

    if (expression === "−") return;

    if (operators.includes(expression.slice(-1))) {
      if (expression.length === 1 && operator !== "−") return;
      expression = expression.slice(0, -1) + operator;
    } else {
      expression += operator;
    }

    justCalculated = false;
    render();
  }

  function deleteLast() {
    errorMessage = "";
    expression = expression.slice(0, -1);
    justCalculated = false;
    render();
  }

  function equals() {
    if (!expression) return;

    try {
      const answer = calculate(expression);
      expressionDisplay.textContent = expression + " =";
      expression = formatNumber(answer);
      resultDisplay.textContent = expression;
      justCalculated = true;
      errorMessage = "";
    } catch (error) {
      errorMessage = error.message === "Cannot divide by zero"
        ? "Cannot divide by 0"
        : "Invalid expression";
      resultDisplay.textContent = errorMessage;
    }
  }

  function changeSign() {
    errorMessage = "";

    if (!expression) {
      expression = "−";
      render();
      return;
    }

    const match = expression.match(/(\d*\.?\d+)$/);

    if (!match) {
      if (expression.endsWith("−")) {
        expression = expression.slice(0, -1);
      } else {
        expression += "−";
      }
      render();
      return;
    }

    const start = match.index;
    const number = match[0];
    const before = expression.slice(0, start);

    if (before.endsWith("−") &&
        (before.length === 1 || operators.includes(before.slice(-2, -1)))) {
      expression = before.slice(0, -1) + number;
    } else {
      expression = before + "−" + number;
    }

    render();
  }

  function percentage() {
    errorMessage = "";

    const match = expression.match(/(\d*\.?\d+)$/);
    if (!match) return;

    const start = match.index;
    const number = Number(match[0]) / 100;

    expression = expression.slice(0, start) + String(number);
    render();
  }

  function handleAction(action) {
    if (action === "clear") clear();
    if (action === "delete") deleteLast();
    if (action === "equals") equals();
    if (action === "decimal") appendNumber(".");
    if (action === "sign") changeSign();
    if (action === "percent") percentage();
  }

  keys.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.number !== undefined) {
      appendNumber(button.dataset.number);
    } else if (button.dataset.operator) {
      appendOperator(button.dataset.operator);
    } else if (button.dataset.action) {
      handleAction(button.dataset.action);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (/^\d$/.test(event.key)) {
      appendNumber(event.key);
    } else if (event.key === ".") {
      appendNumber(".");
    } else if (event.key === "+") {
      appendOperator("+");
    } else if (event.key === "-") {
      appendOperator("−");
    } else if (event.key === "*") {
      appendOperator("×");
    } else if (event.key === "/") {
      event.preventDefault();
      appendOperator("÷");
    } else if (event.key === "Enter" || event.key === "=") {
      event.preventDefault();
      equals();
    } else if (event.key === "Backspace") {
      deleteLast();
    } else if (event.key === "Escape") {
      clear();
    } else {
      return;
    }
  });

  render();
});
