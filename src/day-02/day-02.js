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
 * Each letter corresponds to an RPS throw. Left column is my opponent's throw,
 * Right column is mine.
 *
 * There are some scoring rules. My score for the round would be the sum of:
 * - My throw score: 1 for Rock, 2 for Paper, 3 for Scissors
 * - Outcome score: 0 for a loss, 3 for a draw, 6 for a win
 *
 * Problem is to calculate the total score for the entire input.
 *
 * Algo I'm thinking of:
 *
 * 1. Parse the list line-by-line into an Array of objects containing both
 * throws stored in a semantic type ("Round State").
 * 2. Set up a function to compute score based on game state.
 * 3. Simply fold the sum across all rounds.
 */

const ROCK = Symbol('rock');
const PAPER = Symbol('paper');
const SCISSORS = Symbol('scissors');

/**
 * Statically define what beats a throw in a ring structure, for convenience
 * (this could be extensible, e.g. for Rock-Paper-Scissors-Lizard-Spock by
 * making the value an array or object or the like).
 */
const BEATS_MAP = new Map([
  [ROCK, SCISSORS],
  [PAPER, ROCK],
  [SCISSORS, PAPER],
]);

function parseThrowString(throwString) {
  switch (throwString) {
    case 'A': // falls through
    case 'X': return ROCK;
    case 'B': // falls through
    case 'Y': return PAPER;
    case 'C': // falls through
    case 'Z': return SCISSORS;
  }
}

function parseRoundState(line) {
  const [opponentThrowString, myThrowString] = line.split(' ');
  return {
    opponentThrow: parseThrowString(opponentThrowString),
    myThrow: parseThrowString(myThrowString),
  };
}

function parseRoundStates(lines) {
  return lines.split('\n').map(parseRoundState);
}

function getThrowScore(state) {
  switch (state.myThrow) {
    case ROCK: return 1;
    case PAPER: return 2;
    case SCISSORS: return 3;
    default: return 0;
  }
}

function getOutcomeScore(state) {
  // case: opponent beats me
  if (BEATS_MAP.get(state.opponentThrow) === state.myThrow) return 0;
  // case: I beat my opponent
  if (BEATS_MAP.get(state.myThrow) === state.opponentThrow) return 6;
  // case: draw
  return 3;
}

function getStateScore(state) {
  return getThrowScore(state) + getOutcomeScore(state);
}

async function main() {
  // read list from file
  const lines = await fs.readFile('./data', { encoding: 'utf8' });
  const roundStates = parseRoundStates(lines);
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
