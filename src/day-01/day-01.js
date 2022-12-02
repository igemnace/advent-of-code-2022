const { promises: fs } = require('fs');

/** Calorie Counting
 *
 * Part 1:
 *
 * Input is expected to be in the following format:
 * 1000
 * 2000
 * 3000
 *
 * 4000
 *
 * 5000
 * 6000
 *
 * 7000
 * 8000
 * 9000
 *
 * 10000
 *
 * Each Elf writes down their food's Calories, then separates from the next
 * Elf's entries with an empty line. Problem is to find the Elf carrying the
 * most Calories.
 *
 * Algo I'm thinking of:
 *
 * 1. Parse the list line-by-line into an Array of numbers: first Elf has their
 * Calorie count in index 0, second in index 1, etc.
 * 2. Run a single bubble iteration through the array to bubble up the highest
 * count.
 *
 * O(n), traverses the list twice (roughly). Whether it traverses once or twice,
 * it'll still be O(n) so stick with this for the solution, then optimize
 * afterwards if I think of an elegant way (off the top of my head, maintain
 * only the highest count in memory instead of an array).
 *
 * Part 2:
 *
 * Part 2 is simple enough: get the top 3 instead of the top 1. I'd like to
 * amend step 2 above to resolve this:
 *
 * 2a. Sort the array (descending, to make max easier).
 * 2b. Take any N elements from the start of the sorted array.
 * 2c. Take the sum of those elements.
 *
 * 2a bumps up the time complexity quite a bit -- O(n log(n)) if Array#sort is
 * implemented optimally -- but it does give a really nice interface for 2b. A
 * more optimal algorithm would very likely have to do away with the generality
 * of findMaxN, which I find is fine to keep because the requirements just
 * showed us that N can vary arbitrarily.
 */

function parseCaloriesList(list) {
  const countList = [];
  let current = 0;

  const lines = list.split('\n');
  for (const line of lines) {
    if (line) {
      // accummulate to the current sum
      current += Number(line);
    } else {
      // line is empty: flush the current sum into an Elf's count
      countList.push(current);
      current = 0;
    }
  }

  return countList;
}

function findMaxN(n, list) {
  // sort desc
  const sortedList = [...list].sort((a, b) => b - a);
  return sortedList.slice(0, n);
}

async function main() {
  // read list from file
  const caloriesList = await fs.readFile('./data', { encoding: 'utf8' });
  const countList = parseCaloriesList(caloriesList);
  const max3 = findMaxN(3, countList);

  // print result
  console.log(max3.reduce((acc, a) => acc + a, 0));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
