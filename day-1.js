const { promises: fs } = require('fs');

/** Calorie Counting
 *
 * Input is expected to be in the following format: 1000 2000 3000
 *
 * 4000
 *
 * 5000 6000
 *
 * 7000 8000 9000
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

function findMax(list) {
  let max = list[0];
  for (const element of list) {
    if (element > max) max = element;
  }
  return max;
}

async function main() {
  // read list from file
  const caloriesList = await fs.readFile('./day-1.data', { encoding: 'utf8' });
  const countList = parseCaloriesList(caloriesList);
  const max = findMax(countList);

  // print result
  console.log(max);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1)
  });
