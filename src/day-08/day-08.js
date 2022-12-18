const { promises: fs } = require('fs');

/**
 * Treetop Tree House
 *
 * Part 1:
 *
 * Input is in the following format:
 * 30373
 * 25512
 * 65332
 * 33549
 * 35390
 *
 * This represents a top-down view of a grid of trees, with each number
 * representing the height of the tree at that position (0 being the lowest, 9
 * being the highest).
 *
 * Problem is to find how many trees are visible from outside the grid, when
 * looking at a front, side, or back view. We only need to consider rows and
 * columns, no diagonals.
 *
 * An example of computing visibility for a single row would be, take the second
 * row: 25512.
 * - The leftmost 2 is visible, because edge trees are *always* visible --
 *   there's nothing left to block their view.
 * - The next 5 though, is visible from the left -- the 2 to its left is too
 *   small to block its view.
 * - The center 5 is *not* visible from the left, as it's covered by the
 *   previous 5, but it *is* visible from the right, where only 1- and 2-height
 *   trees exist.
 * - The next 1 is *not* visible, neither from the left nor the right. It's
 *   surrounded by trees that are taller than it.
 * - The rightmost 2 is again visible, as it's an edge tree once again.
 *
 * The above rules of visibility will apply to each row and column. At the end,
 * we have to count how many trees are visible.
 *
 * Algo I'm thinking of:
 *
 * 1. Store the grid representation in a matrix type (potentially just a 2D
 * array, actually). That way iterating through rows and columns would be easy,
 * as it'd be iterating through a single index.
 * 2. Traverse the matrix one-by-one. The order of traversal isn't important
 * here, we just need to walk each element at least once (and optimally, only
 * once). Left-to-right, top-to-bottom sounds simple enough.
 * 3. For each element, check if it's visible:
 *   a. If it's an edge element, it's automatically visible (short circuit this
 *   condition, so we don't have to traverse its row and column if we know it's
 *   an edge!).
 *   b. If not, take its row and its column and check if there are
 *   equal-or-higher trees in either. We'll also need to check from both sides
 *   (e.g. for a row, check from the left and the right) so take care to split
 *   the row and column and check each half individually.
 * 4. Maintain a running count of visible elements. Once we're done with the
 * traversal, this should represent the final count.
 *
 * It bears mentioning that the above is a naive approach, time-complexity-wise.
 * For an m x n matrix, we're checking each element's row and column, so that's
 * O(m + n). Multiply that for each element in the matrix and that's O((m x n) x
 * (m + n)). Simplifying with m = n (as we usually do, in big O notation), we
 * see that we're actually working with O(n ^ 3). For comparison, a traversal is
 * O(n ^ 2).
 *
 * There are a couple of reasons I'm sticking with the above approach for now,
 * leaving optimization for later:
 *
 * - My thinking on this is actually whether it's possible to find a closed-form
 *   solution for visibility by thinking about the problem mathematically, and
 *   that'd very likely give me a much more optimized algorithm
 *   time-complexity-wise. However, my experience in software development is
 *   that when problem requirements change (sometimes in a seemingly small
 *   way!), the closed-form approach can be thrown out of whack and you'd have
 *   to write a completely new solution. Things are more resilient to changing
 *   requirements when you think about it programmatically, as you'll naturally
 *   end up with abstraction layers in such a way where small changes in
 *   requirements can translate to just small changes in a single layer.
 *
 * - This can be split up into a divide-and-conquer approach and run with
 *   parallelism (e.g. if we have 4 cores, split the matrix into 4 groups of
 *   elements and assign each one to a core), so optimization can actually be
 *   done for sizable gains in the implementation itself instead of in the
 *   algorithm.
 *
 * Part 2:
 *
 * Now we don't want to just check if a tree is *eventually* hidden in a
 * direction -- we want to see how many trees can be viewed before we hit an
 * obstruction. Problem calls this the "viewing distance".
 *
 * For our example of 25512, say we were on the middle 5 tree:
 * - Viewing distance to the left is just 1, because we're immediately blocked
 *   by a 5 tree to the left.
 * - Viewing distance to the right is 2, because we can see all the way out to
 *   the edge, passing two trees (each with height 1 and 2).
 *
 * Problem then defines a "scenic score", which is the viewing distances for
 * each direction multiplied all together. Problem is to find the highest scenic
 * score.
 *
 * Notice that this is a different problem altogether -- we don't care whether a
 * tree is visible at all or not. It just uses eerily similar semantics when
 * we're finding the viewing distance.
 *
 * With that, I'd have a different algo (with the same parsing logic), amending
 * steps 3 and 4 above:
 *
 * 3'. For each element, compute its scenic score (and thus its individual
 *     viewing distances). Let's repurpose our generator functions for this --
 *     we'll need to tweak getLeft and getTop so we iterate in order from the
 *     center tree (basically, we'll have to yield in reverse order one way or
 *     another).
 * 4'. Maintain the highest scenic score in memory. Once we're done with the
 *     traversal, this should represent the highest scenic score (sort of like a
 *     single "bubble up" for a 2D array).
 */

function parseRow(line) {
  // make sure to cast to number, so comparison is semantically correct
  return line.split('').map(Number);
}

function parseMatrix(lines) {
  return lines.map(parseRow);
}

function parseLines(string) {
  const separatedString = string.charAt(string.length - 1) === '\n'
    ? string.slice(0, string.length - 1)
    : string;

  return separatedString.split('\n');
}

/**
 * Define generator functions for getting iterable rows and columns from a
 * matrix, which will greatly increase readability. Doing it this way instead of
 * computing an array on the fly means we get savings from lazy execution (each
 * value is streamed through to the for-of we use these in, so we don't
 * double-traverse).
 */

function* getLeft(i, j, matrix) {
  // this is easy: row is already an array
  // we have to yield in reverse order though
  yield* matrix[i].slice(0, j).reverse();
}

function* getRight(i, j, matrix) {
  // this is easy: row is already an array
  yield* matrix[i].slice(j + 1);
}

function* getTop(i, j, matrix) {
  // yield in reverse order!
  for (let cur = i - 1; cur >= 0; cur--) {
    yield matrix[cur][j];
  }
}

function* getBottom(i, j, matrix) {
  for (let cur = i + 1; cur < matrix.length; cur++) {
    yield matrix[cur][j];
  }
}

function isVisibleFromSide(element, side) {
  for (const current of side) {
    if (current >= element) return false;
  }
  return true;
}

/**
 * Main visibility checker function.
 *
 * IMPORTANT: i and j here aren't actually the i and j you know from matrix
 * convention... these are 0-based indices instead, since we're actually working
 * with 2D arrays.
 */
function isVisible(i, j, matrix) {
  // short circuit on edge trees
  const isEdgeElement = (
    i === 0 ||
    i === matrix.length - 1 ||
    j === 0 ||
    j === matrix[i].length - 1
  );
  if (isEdgeElement) return true;

  const element = matrix[i][j];

  // check the row: this is O(n), given an m x n matrix
  if (isVisibleFromSide(element, getLeft(i, j, matrix))) return true;
  if (isVisibleFromSide(element, getRight(i, j, matrix))) return true;

  // check the column: this is O(m), given an m x n matrix
  if (isVisibleFromSide(element, getTop(i, j, matrix))) return true;
  if (isVisibleFromSide(element, getBottom(i, j, matrix))) return true;

  // total runtime in the worst case then, is O(m + n). linear time
  return false;
}

function countVisible(matrix) {
  // maintain a running count
  let count = 0;

  // traverse the matrix: use the typical i and j indices
  // but use 0-based indices for simplicity
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      // count only the visible elements
      if (isVisible(i, j, matrix)) count++;
    }
  }

  // isVisible is O(n), while traversal is O(n ^ 2). total runtime is O(n ^ 3)
  return count;
}

function getViewingDistanceFromSide(element, side) {
  let viewingDistance = 0;

  for (const current of side) {
    viewingDistance++;
    // stop counting if we hit an obstruction
    if (current >= element) break;
  }

  return viewingDistance;
}

function getScenicScore(i, j, matrix) {
  const element = matrix[i][j];

  // get viewing distance for each side
  const viewingDistances = [
    getViewingDistanceFromSide(element, getTop(i, j, matrix)),
    getViewingDistanceFromSide(element, getLeft(i, j, matrix)),
    getViewingDistanceFromSide(element, getRight(i, j, matrix)),
    getViewingDistanceFromSide(element, getBottom(i, j, matrix)),
  ];

  // again, we go over the row and the column, so this is linear time
  return viewingDistances
    // omit the second arg of reduce so we start with the first element
    .reduce((scenicScore, viewingDistance) => scenicScore * viewingDistance);
}

function findMaxScenicScore(matrix) {
  // maintain max in memory
  let max = 0;

  // traverse the matrix: use the typical i and j indices
  // but use 0-based indices for simplicity
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      // remember a scenic score only if it's higher than the current max
      const scenicScore = getScenicScore(i, j, matrix);
      if (scenicScore > max) max = scenicScore;
    }
  }

  // getScenicScore is O(n), while traversal is O(n ^ 2). total runtime is O(n ^ 3)
  return max;
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);
  const matrix = parseMatrix(lines);

  // print the result
  console.log(findMaxScenicScore(matrix));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
