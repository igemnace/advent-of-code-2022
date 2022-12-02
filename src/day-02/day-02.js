const { promises: fs } = require('fs');

/**
 * Rock Paper Scissors
 *
 * Part 1:
 *
 * Input is expected to be in the following format:
 * A Y
 * B X
 * C Z
 *
 * Each letter corresponds to a shape (an RPS throw: Rock, Paper, or Scisscors).
 * Left column is my opponent's shape, Right column is mine.
 *
 * There are some scoring rules. My score for the round would be the sum of:
 * - My shape score: 1 for Rock, 2 for Paper, 3 for Scissors
 * - Outcome score: 0 for a loss, 3 for a draw, 6 for a win
 *
 * Problem is to calculate the total score for the entire input.
 *
 * Algo I'm thinking of:
 *
 * 1. Parse the list line-by-line into an Array of objects containing both
 * shapes stored in a semantic type ("Round State").
 * 2. Set up a function to compute score based on game state.
 * 3. Simply fold the sum across all rounds.
 *
 * Part 2:
 *
 * Second column is now what the outcome should be, which we just put into the
 * round state. Now getOutcomeScore doesn't have to compute anything -- just
 * read off the outcome from state!
 */

const ROCK = Symbol('rock');
const PAPER = Symbol('paper');
const SCISSORS = Symbol('scissors');

const LOSS = Symbol('loss');
const DRAW = Symbol('draw');
const WIN = Symbol('win');

/**
 * Statically define what beats a shape in a ring structure, for convenience
 * (this could be extensible, e.g. for Rock-Paper-Scissors-Lizard-Spock by
 * making the value an array or object or the like).
 */
const BEATS_MAP = new Map([
  [ROCK, SCISSORS],
  [PAPER, ROCK],
  [SCISSORS, PAPER],
]);
// reverse the relationship
const BEATEN_BY_MAP = new Map([...BEATS_MAP.entries()].map(([k, v]) => [v, k]));

function parseShapeString(shapeString) {
  switch (shapeString) {
    case 'A': return ROCK;
    case 'B': return PAPER;
    case 'C': return SCISSORS;
  }
}

function parseOutcomeString(outcomeString) {
  switch (outcomeString) {
    case 'X': return LOSS;
    case 'Y': return DRAW;
    case 'Z': return WIN;
  }
}

function parseRoundState(line) {
  const [opponentShapeString, outcomeString] = line.split(' ');
  return {
    opponentShape: parseShapeString(opponentShapeString),
    outcome: parseOutcomeString(outcomeString),
  };
}

function parseRoundStates(lines) {
  return lines.split('\n').map(parseRoundState);
}

function inferShape(shape, outcome) {
  switch (outcome) {
    case LOSS: return BEATS_MAP.get(shape);
    case DRAW: return shape;
    case WIN: return BEATEN_BY_MAP.get(shape);
  }
}

function populateRoundState(state) {
  // infer my shape
  return {
    ...state,
    myShape: inferShape(state.opponentShape, state.outcome),
  };
}

function getShapeScore(state) {
  switch (state.myShape) {
    case ROCK: return 1;
    case PAPER: return 2;
    case SCISSORS: return 3;
    default: return 0;
  }
}

function getOutcomeScore(state) {
  switch (state.outcome) {
    case LOSS: return 0;
    case DRAW: return 3;
    case WIN: return 6;
    default: return 0;
  }
}

function getStateScore(state) {
  return getShapeScore(state) + getOutcomeScore(state);
}

async function main() {
  // read list from file
  const lines = await fs.readFile('./data', { encoding: 'utf8' });
  const incompleteRoundStates = parseRoundStates(lines);
  const roundStates = incompleteRoundStates.map(populateRoundState);
  const scores = roundStates.map(getStateScore);

  // print result
  console.log(scores.reduce((acc, s) => acc + s, 0));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
