var MAX_VALUE = 1e100;
var MIN_VALUE = 1e-99;
var PRECISION = 10;
var OPERATIONS = [" + ", " - ", " * ", " / ", " ^ ", "-"]; // add, subtract, multiply, divide, exponent, negative
var FULL_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")"];
var FULL_KEYWORDS = [" + ", " - ", " * ", " / ", " ^ ", "-", "(", ")", "Ans"];
var RESTRICTED_OPERATIONS = [" + ", " - ", " * ", " / ", " ^ "];
var NUMERICAL_CHARACTERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// returns a number
function evaluateExpression(array) {
  // evaluate parentheses, testing for initial overflow/underflow along the way.
  for (var i = 0; i < array.length; i++) {
    if (Array.isArray(array[i])) {
      array[i] = evaluateExpression(array[i]);
    }
    else if (!OPERATIONS.includes(array[i])) {
      if (!isFinite(array[i]) || Math.abs(array[i]) >= MAX_VALUE)
        throw new Error("Error input overflow");
      else if (Math.abs(array[i]) < MIN_VALUE)
        array[i] = 0;
    }
  }
  if (array.length == 1)
    return Number(array[0].toPrecision(PRECISION));

  // evaluate exponents and negatives from right to left. the result goes into arrayE in reverse order, and then arrayE gets re-reversed.
  var arrayE = [];
  var i = array.length - 1;
  while (i > 0) {
    // process negation
    if (array[i - 1] === "-") {
      array[i - 1] = -array[i];
      i--;
    }

    // process exponentiation
    if (array[i - 1] === " ^ ") {
      if (array[i - 2] == 0 && array[i] == 0)
        throw new Error("Error power");

      var value = Math.pow(array[i - 2], array[i]);
      if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
        throw new Error("Error power");
      else if (Math.abs(value) < MIN_VALUE)
        value = 0;

      array[i - 2] = value;
      i -= 2;
    }
    else {
      arrayE.push(array[i]);
      i--;
    }
  }
  // final process negation
  if (i == 0)
    arrayE.push(array[0]);
  arrayE.reverse();
  if (arrayE.length == 1)
    return Number(arrayE[0].toPrecision(PRECISION));

  // evaluate multiplication and division
  var arrayM = [];
  i = 1;
  while (i < arrayE.length) {
    if (arrayE[i] === " * " || arrayE[i] === " / ") {
      var value = (arrayE[i] === " * " ? arrayE[i - 1] * arrayE[i + 1] : arrayE[i - 1] / arrayE[i + 1]);
      if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
        throw new Error("Error mult " + !isFinite(value));
      else if (Math.abs(value) < MIN_VALUE)
        value = 0;

      arrayE[i + 1] = value;
    }
    else {
      arrayM.push(arrayE[i - 1]);
      arrayM.push(arrayE[i]);
    }

    i += 2;
  }
  arrayM.push(arrayE[arrayE.length - 1]);
  if (arrayM.length == 1)
    return Number(arrayM[0].toPrecision(PRECISION));

  // evaluate addition and subtraction
  // upon every additive operation, check the value of the final number and compare it to the operands
  // Artificially cut out digits after an additive operation
  for (var i = 1; i < arrayM.length; i += 2) {
    var value = (arrayM[i] === " + " ? arrayM[i - 1] + arrayM[i + 1] : arrayM[i - 1] - arrayM[i + 1]);
    if (!isFinite(value) || Math.abs(value) >= MAX_VALUE)
      throw new Error("Error add");
    else if (Math.abs(value) < MIN_VALUE)
      value = 0;

    var absValue = Math.abs(value);
    var prevValue = Math.max(arrayM[i - 1], arrayM[i + 1]);
    if (absValue < prevValue && absValue != 0) {
      var ratio = absValue / prevValue;
      var newPrecision = PRECISION + Math.round(Math.log(ratio) / Math.log(10));
      value = (newPrecision > 0 ? Number(value.toPrecision(newPrecision)) : 0);
    }

    arrayM[i + 1] = value;
  }

  return Number(arrayM[arrayM.length - 1].toPrecision(PRECISION));
}

// ---------------------------------------------------------------------------------------------------------------------------------------------

// input is an array of strings, parentheses is a number: how many unclosed left parentheses.

// display our (potentially incomplete) input in string format
function inputString(input) {
  if (input.length == 0) {
    return "0";
  }
  else {
    // replace cases of two or more spaces with a single space.
    return input.join("").replace(/ {2,}/g, " ");
  }
}

// step 1: pad right parentheses

function padParentheses(input, parentheses) {
  var output = input.slice();

  for (var i = 0; i < parentheses; i++)
    output.push(")");

  return output;
}

// step 2: turn number subarrays and Ans into actual numerical values

function createNumbers(input, ansValue) {
  var output = [];
  var i = 0;
  while (i < input.length) {
    if (FULL_OPERATIONS.includes(input[i])) { // if generalized operation, push and move on.
      output.push(input[i]);
      i++;
    }
    else if (input[i] == "Ans") {
      output.push(ansValue);
      i++;
    }
    else {
      var number = 0;
      var frontQ = false;
      if (!isNaN(parseInt(input[i].charAt(0), 10))) {
        number = parseInt(input[i], 10);
        frontQ = true;
        i++;
      }
      if (i < input.length && input[i].charAt(0) == ".") {
        number += parseFloat(input[i] + "0");
        frontQ = true;
        i++;
      }
      if (i < input.length && input[i].charAt(0) == "e") {
        if (frontQ)
          number *= parseFloat("1" + input[i]);
        else
          number = parseFloat("1" + input[i]);
        i++;
      }

      output.push(number);
    }
  }

  return output;
}

// step 3: re-arrange parentheses into sub-expressions

function createSubexpressions(input, begin, end) {
  var output = [];
  var i = begin;
  while (i < end) {
    if (input[i] != "(") {
      output.push(input[i]);
      i++;
    }
    else {
      var openParentheses = 1;
      var j = i + 1;
      while (j < end) { // "j < end" might as well be just "true"
        if (input[j] == "(")
          openParentheses++;
        else if (input[j] == ")")
          openParentheses--;

        if (openParentheses == 0)
          break;
        j++;
      }

      output.push(createSubexpressions(input, i + 1, j));
      i = j + 1;
    }
  }

  return output;
}

function createAllSubexpressions(input) {
  return createSubexpressions(input, 0, input.length);
}
