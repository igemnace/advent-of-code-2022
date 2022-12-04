const { promises: fs } = require('fs');

/**
 * Camp Cleanup
 *
 * Input is in the following format:
 * 2-4,6-8
 * 2-3,4-5
 * 5-7,7-9
 * 2-8,3-7
 * 6-6,4-6
 * 2-6,4-8
 *
 * Each line represents the assignments of a pair of elves, comma-separated.
 * Problem is to find how many pair assignments have one assignment fully
 * contain the other.
 *
 * Algo I'm thinking of:
 *
 * 1. Parse input line-by-line into an Array of pairs of Ranges, a semantic
 * type. Idea here: I could use tuples for the ranges ([min, max] inclusive by
 * convention), but I'd rather use an object with explicit keys because I never
 * know when I'd need to store more data in the type.
 * 2. Set up a function operating on my Range type to compute whether one set
 * contains the other. As we're working with contiguous ranges, this can
 * actually be implemented by bounds checks -- O(1)!
 * 3. Filter the Array of Range pairs using the above function, then count.
 */

function parseLines(string) {
  const separatedString = string.charAt(string.length - 1) === '\n'
    ? string.slice(0, string.length - 1)
    : string;

  return separatedString.split('\n');
}

function parseRange(rangeString) {
  const [lowerBound, upperBound] = rangeString.split('-');
  return {
    lowerBound: Number(lowerBound),
    upperBound: Number(upperBound),
  };
}

function parseRanges(line) {
  const rangeStrings = line.split(',');
  return rangeStrings.map(parseRange);
}

function doesContain(containerRange, rangeToCheck) {
  return (
    // containerRange lower bound must be equal or lower
    containerRange.lowerBound <= rangeToCheck.lowerBound &&
    // containerRange upper bound must be equal or higher
    containerRange.upperBound >= rangeToCheck.upperBound
  );

  // O(1)!
  // Because this is such a cheap check, we can afford to do it twice:
  // Does A contain B? does B contain A?
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);
  const rangePairs = lines.map(parseRanges);
  const overlappingPairs = rangePairs
    .filter(([a, b]) => doesContain(a, b) || doesContain(b, a));

  // print result
  console.log(overlappingPairs.length);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
