const { promises: fs } = require('fs');

/**
 * Camp Cleanup
 *
 * Part 1:
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
 *
 * Part 2:
 *
 * Now it's time to find pairs that overlap at all, not just fully overlap. This
 * is yet another set operation: finding a intersection, as opposing to finding
 * a subset.
 *
 * Amendment would be to step 2:
 *
 * 2a. Set up a function operating on my Range type to compute whether two
 * ranges intersect. Again, as we're working with contiguous ranges, this is
 * also another bounds check implementation.
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

function doesContainElement(containerRange, elementToCheck) {
  return (
    containerRange.lowerBound <= elementToCheck &&
    containerRange.upperBound >= elementToCheck
  );
}

/**
 * Idea here: all I need to check is if each of rangeB's bounds falls inside
 * rangeA -- no need to check both at the same time. We'll also need to check
 * inversely for rangeB containing rangeA's bounds.
 *
 * I've extracted out {@link doesContainElement} to make this a lot easier to
 * read.
 */
function doesIntersect(rangeA, rangeB) {
  return (
    doesContainElement(rangeA, rangeB.lowerBound) ||
    doesContainElement(rangeA, rangeB.upperBound) ||
    doesContainElement(rangeB, rangeA.lowerBound) ||
    doesContainElement(rangeB, rangeA.upperBound)
  );
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);
  const rangePairs = lines.map(parseRanges);
  const overlappingPairs = rangePairs
    .filter(([a, b]) => doesIntersect(a, b));

  // print result
  console.log(overlappingPairs.length);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
