

// initialize state variables.
// declare click behavior for buttons.

var input = [];
var parentheses = 0;
var display = "0";
var topDisplay = "Ans = 0";
var justEvaluatedQ = false; // true if top is "3 * 4 =", false if top is "Ans = 12".
var ans = 0;

function updateDisplay() {
  display = inputString(input);
  document.getElementById("main-line").innerHTML = display;
}

function updateTopDisplay() {
  document.getElementById("top-line").innerHTML = topDisplay;
}

function justEvaluatedReset(idString) {
  if (justEvaluatedQ) {
    justEvaluatedQ = false;
    topDisplay = "Ans = " + ans;
    updateTopDisplay();
    
    // handle error
    if (input[0] == "Error") {
      input = [];
    }
    // if we're not adding, subtracting, multiplying, dividing, or exponentiating by our output number, then clear out the input.
    else if (!RESTRICTED_OPERATIONS.includes(idString) && idString != "backspace") {
      input = [];
    }
  }
}

function lastFullNumerical(input) {
  // last element's digit is numerical, or a decimal point and the element before that is a number, or is ans, or is ), then: 
  // return true.
  return (!isNaN(input[input.length - 1].substr(-1)) && input[input.length - 1].substr(-1) != " ") || (input[input.length - 1] == "." && !isNaN(input[input.length - 2])) || (input[input.length - 1] == "Ans") || (input[input.length - 1] == ")");
}

// ---------------------------------------------------------------------------------------------------------------------------------------------

// Enter: =

function outputToNewInput(output) {
  // process numerical output (which is an integer)
  var stringOutput = output.toString();

  // process negative number
  var negativeQ = (stringOutput.charAt(0) == "-");
  if (negativeQ) {
    stringOutput = stringOutput.slice(1);
    output = -output;
  }

  // integer with too many digits i.e. more than 10
  if (stringOutput.search(/^[0-9]+$/) != -1 && stringOutput.length > PRECISION) {
    var stringOutput = output.toExponential();
  }

  // process exponential
  var index = stringOutput.search(/e/);
  var input = (index == -1 ? [stringOutput] : [stringOutput.slice(0, index), stringOutput.slice(index).replace(/e\+/, "e")]);

  // process decimal
  index = input[0].search(/\./);
  if (index != -1) {
    input.unshift(input[0].slice(0, index));
    input[1] = input[1].slice(index);
  }

  // tack on front negative sign, if necessary
  if (negativeQ)
    input.unshift("-");

  return input;
}

document.getElementById(" = ").onclick = function() {
  // if justEvaluated or blank, do nothing.
  if (justEvaluatedQ || input.length == 0) {
    return;
  }
  // if not lastFullNumerical, do nothing.
  if (!lastFullNumerical(input)) {
    return;
  }

  console.log("input to evaluate:");
  console.log(input);

  input = padParentheses(input, parentheses);
  parentheses = 0;
  var expression = createAllSubexpressions(createNumbers(input, ans));
  try {
    var output = evaluateExpression(expression); // numerical output

    // update top row, main row, and ans
    topDisplay = inputString(input) + " =";
    updateTopDisplay();

    input = outputToNewInput(output);
    updateDisplay();
    console.log("next input:");
    console.log(input);

    ans = output;
    justEvaluatedQ = true;
  }
  catch (error) {
    topDisplay = inputString(input) + " =";
    updateTopDisplay();
    
    input = ["Error"];
    updateDisplay();
    console.log("next input:");
    console.log(input);
    
    ans = 0;
    justEvaluatedQ = true;
  }
};

// for all of these, call updateDisplay() at the end no matter what.


// All Clear
document.getElementById("AC").onclick = function() {
  // clear ans if necessary
  if (input.length == 0) {
    topDisplay = "Ans = 0";
    updateTopDisplay();
    
    ans = 0;
  }
  
  justEvaluatedReset("AC");
  
  input = [];
  parentheses = 0;
  updateDisplay();
};

// Backspace
document.getElementById("backspace").onclick = function() {
  justEvaluatedReset("backspace");

  if (input.length > 0) {
    if (FULL_KEYWORDS.includes(input[input.length - 1])) {
      var popped = input.pop();
      if (popped == "(")
        parentheses--;
      else if (popped == ")")
        parentheses++;
    }
    else {
      input[input.length - 1] = input[input.length - 1].slice(0, -1);
      if (input[input.length - 1] == "")
        input.pop();
    }
  }

  updateDisplay();
};

// RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "]
RESTRICTED_OPERATIONS.forEach(function(id) {
  document.getElementById(id).onclick = function() {
    justEvaluatedReset(id);

    if (input.length > 0) {
      // if restricted operation, override the restricted operation.
      if (RESTRICTED_OPERATIONS.includes(input[input.length - 1])) {
        input[input.length - 1] = id;
      }
      // if full numerical, tack on our operation.
      else if (lastFullNumerical(input)) {
        input.push(id);
      }
    }

    updateDisplay();
  };
});

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

// numerical buttons
NUMERICAL_CHARACTERS.forEach(function(id) {
  document.getElementById(id).onclick = function() {
    justEvaluatedReset(id);

    if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
      if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
        input.push(" * ");
        input.push(id);
      }
      else {
        input.push(id);
      }
    }
    else { // if numerical button press follows a number
      // if identically zero, override
      if (input[input.length - 1] == "0") {
        input[input.length - 1] = id;
      }
      else if (input[input.length - 1] == "e0") {
        input[input.length - 1] = "e" + id;
      }
      // otherwise, tack on
      else {
        input[input.length - 1] += id;
      }
    }

    updateDisplay();
  };
});

// Ans

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("Ans").onclick = function() {
  justEvaluatedReset("Ans");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("Ans");
    }
    else {
      input.push("Ans");
    }
  }
  else if (lastFullNumerical(input)) {
    input.push(" * ");
    input.push("Ans");
  }

  updateDisplay();
};

// negative

// RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "]

document.getElementById("-").onclick = function() {
  justEvaluatedReset("-");

  if (RESTRICTED_OPERATIONS.includes(input[input.length - 1]) || input[input.length - 1] == "(" || input.length == 0) {
    input.push("-");
  }

  if (input[input.length - 1] == "e") {
    input[input.length - 1] += "-";
  }

  updateDisplay();
};

// decimal point

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("decimal").onclick = function() {
  justEvaluatedReset(".");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push(".");
    }
    else {
      input.push(".");
    }
  }
  else if (input[input.length - 1].charAt(0) != "." && input[input.length - 1].charAt(0) != "e") {
    input.push(".");
  }

  updateDisplay();
};

// exponential

// var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"]

document.getElementById("e").onclick = function() {
  justEvaluatedReset("e");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("e");
    }
    else {
      input.push("e");
    }
  }
  // no "e" or isolated decimal
  else if (input[input.length - 1].charAt(0) != "e" && !(input[input.length - 1] == "." && isNaN(input[input.length - 2]))) {
    input.push("e");
  }
  
  updateDisplay();
};

// left paren

document.getElementById("(").onclick = function() {
  justEvaluatedReset("(");

  if (FULL_KEYWORDS.includes(input[input.length - 1]) || input.length == 0) {
    if (input[input.length - 1] == ")" || input[input.length - 1] == "Ans") {
      input.push(" * ");
      input.push("(");
    }
    else {
      input.push("(");
    }

    parentheses++;
  }
  else if (lastFullNumerical(input)) {
    input.push(" * ");
    input.push("(");

    parentheses++;
  }

  updateDisplay();
};

// right paren

document.getElementById(")").onclick = function() {
  justEvaluatedReset(")");

  if (parentheses > 0 && lastFullNumerical(input)) {
    input.push(")");
    parentheses--;
  }

  updateDisplay();
};

