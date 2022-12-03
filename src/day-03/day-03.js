const { promises: fs } = require('fs');

/**
 * Rucksack Reorganization
 *
 * Part 1:
 *
 * Input is in the following format:
 * vJrwpWtwJgWrhcsFMMfFFhFp
 * jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL
 * PmmdzqPrVvPwwTWBwg
 * wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn
 * ttgJtRGJQctTZtZT
 * CrZsJsPPZsGzwwsLwLmpwMDw
 *
 * Each line is called a "rucksack", with two "compartments" (its two halves),
 * filled with "items" (the letters).
 *
 * Problem is two-fold:
 *
 * 1. For each line, find the common letter between the two halves.
 * 2. For all the common letters, compute the sum of their priorities.
 *
 * Priority is as follows: a-z is priority 1-26, A-Z is 27-52.
 *
 * Algo I'm thinking of:
 *
 * 1. Parse input line-by-line into an Array of strings. Then, split each line
 * in two into an Array of Arrays of 2 strings.
 * 2. Write a comparator to check for the common letter between two strings --
 * run through the first string and build an existence Map of its letters, then
 * run through the second string and check against that map. This is a
 * well-known trick to compare two lists with O(n) instead of the naive O(n^2).
 * 3. Set up a function to compute priority. I'm thinking a static value Map
 * would be safest, but I want to infer using ASCII values heh. a-z and A-Z are
 * all consecutive in ASCII (and therefore, also in Unicode), so I can just
 * compute priority from that with a bit of math. This way I don't have to
 * statically set up each letter...
 */

function parseRucksackCompartments(string) {
  /**
   * Remove terminating newline if existing, so it's easy to parse lines with
   * String#split.
   *
   * Btw: this is a pitfall many people tend to miss in Unix: newline is a line
   * *terminator*, not a line separator. So far in this AoC I haven't run into
   * bugs handling it as a sep, but today I have.
   */
  const separatedString = string.charAt(string.length - 1) === '\n'
    ? string.slice(0, string.length - 1)
    : string;

  return separatedString.split('\n')
    .map(line => ([
      // split into halves. Array#slice uses the typical [a, b) interval in
      // computing so the bins work out quite nicely
      line.slice(0, line.length / 2),
      line.slice(line.length / 2, line.length),
    ]));
}

function findCommon(a, b) {
  // O(m): build the existence map
  const letterMap = new Map();
  for (const letter of a) {
    letterMap.set(letter, true);
  }

  // O(n): check the second string against the map
  for (const letter of b) {
    if (letterMap.has(letter)) return letter;
  }

  // total algo is O(m + n), which is just O(n) -- linear time
}

/**
 * Gets the difference between char codes of two letters. Will be useful for
 * figuring out not the char code of a letter itself (e.g. for a-z that's
 * 97-122, not as immediately useful for computing priority), but its relative
 * distance from an anchor point (e.g. for a-z anchored at a, that's 0-25, much
 * more useful).
 * 
 * @example
 * getCharCodeDistance('a', 'b');
 * // 1
 */
function getCharCodeDistance(a, b) {
  return b.charCodeAt(0) - a.charCodeAt(0);
}

/**
 * What I want to do here, in pseudo-code:
 *
 * charCodeOf(letter) - charCodeOf('a') + 1
 *
 * This maps a-z cleanly to 1-26.
 */
function getLowercasePriority(letter) {
  return getCharCodeDistance('a', letter) + 1;
}

/**
 * I can do the same thing here:
 *
 * charCodeOf(letter) - charCodeOf('A') + 1
 *
 * which maps A-Z cleanly to 1-26. Then I just add 26.
 */
function getUppercasePriority(letter) {
  return getCharCodeDistance('A', letter) + 1 + 26; // treat 26 offset separately
}

const lowercaseRegex = /[a-z]/;
const uppercaseRegex = /[A-z]/;

function getPriority(letter) {
  if (lowercaseRegex.test(letter)) return getLowercasePriority(letter);
  if (uppercaseRegex.test(letter)) return getUppercasePriority(letter);

  // exception case
  return 0;
}

async function main() {
  // read list from file
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const rucksacks = parseRucksackCompartments(input);
  const commonLetters = rucksacks.map(([a, b]) => findCommon(a, b));
  const priorities = commonLetters.map(getPriority);

  // print result
  console.log(priorities.reduce((acc, p) => acc + p, 0));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
