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
 *
 * Part 2:
 *
 * There's some reorganization that I'll have to do here. The lines in the input
 * are now grouped into three, and instead of checking for common letters
 * between halves, I now have to find common letters across the three grouped
 * lines.
 *
 * Some amendments I'm thinking of:
 * 1a. No longer needed to split into two. Separate the splitting out into its
 * own function.
 * 1b. Now needed to group lines into groups of 3s. Separate that out also into
 * its own function.
 * 2a. Overload the comparator to handle variadic arguments. Algo I'm thinking
 * of here is:
 *   0. Instead of a first string and a second string, think in terms of
 *   "previous string" and "current string".
 *   1. Build an existence map for the previous string.
 *   2. Build an existence map for the current string as well: run through the
 *   current string, while checking against the previous existence map: if
 *   existing in both, add to the current existence map.
 *   3. Move to the next string. The current existence map will now be its
 *   previous existence map. This should be able to handle finding common
 *   letters for any number of strings.
 */

function parseLines(string) {
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

  return separatedString.split('\n');
}

function parseRucksackCompartments(lines) {
  return lines.map(line => ([
      // split into halves. Array#slice uses the typical [a, b) interval in
      // computing so the bins work out quite nicely
      line.slice(0, line.length / 2),
      line.slice(line.length / 2, line.length),
    ]));
}

function parseRucksackGroups(lines, numPerGroup) {
  const groups = [];
  let currentGroup = [];

  // group into numPerGroup
  for (const line of lines) {
    currentGroup.push(line);

    // flush to groups once group size is hit
    if (currentGroup.length === numPerGroup) {
      groups.push(currentGroup);
      currentGroup = [];
    }
  }

  // check for leftovers after the loop
  // these are the remainder if lines is not divisible by numPerGroup
  if (currentGroup.length) groups.push(currentGroup);

  return groups;
}

/**
 * If n is the length of strings and m is the number of strings, time complexity
 * here should be O(n * m). We win against the naive case of nested iterations
 * without building maps, which is O(n ^ m).
 *
 * Notice, this is a generalized case of our previous findCommon, where m was 2:
 * building the map gets you O(n * 2), which is linear time, whereas the naive
 * approach gets you O(n ^ 2), which is quadratic time.
 */
function findCommon(...strings) {
  // start previousMap at null, so we have a well-defined initial condition
  let previousMap = null;
  let currentMap = new Map();

  for (const string of strings) {
    for (const letter of string) {
      // if this is our first string, just initialize the map
      if (previousMap === null) currentMap.set(letter, true);

      // on all other iterations, run through while checking against previousMap
      else if (previousMap.has(letter)) currentMap.set(letter, true);
    }

    // set up next iteration
    previousMap = currentMap;
    currentMap = new Map();
  }

  // after the loop, previousMap will contain all the common letters
  return [...previousMap.keys()];
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
  const lines = parseLines(input);
  // group into 3
  const groups = parseRucksackGroups(lines, 3);
  const commonLetters = groups.map(([a, b, c]) => findCommon(a, b, c));
  // we expect just 1 common letter
  const priorities = commonLetters.map(([letter]) => getPriority(letter));

  // print result
  console.log(priorities.reduce((acc, p) => acc + p, 0));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
