# Equation Solver Agent

An example AI agent that solves arithmetic equations using PEMDAS order of operations. The agent performs each step by delegating tasks to specific tools (add, sub, mul, div) and includes a critique module to validate each step before proceeding.

## Features
Follows PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction) rules.

## Uses modular tools for:

add(a, b)

sub(a, b)

mul(a, b)

div(a, b)

## Built-in critique mechanism to:

Validate intermediate instructions.

Catch logical or operational errors.

Returns the final result of the computation along with a trace of the steps taken.

