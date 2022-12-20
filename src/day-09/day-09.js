const { promises: fs } = require('fs');

/**
 * Rope Bridge
 *
 * Part 1:
 *
 * Problem begins with the context: imagine we're on a grid. There's a rope on
 * the grid, and the head H and the tail T of the rope are marked on the grid,
 * e.g.
 * ....
 * .TH.
 * ....
 *
 * ....
 * .H..
 * ..T.
 * ....
 *
 * ...
 * .H. (H covers T)
 * ...
 *
 * We are given a set of rules as to how T should move, but the general idea is
 * it always wants to follow H such that they're never more than a tile apart
 * (kind of like a naive follower algorithm for a roguelike!).
 *
 * Input is in the format:
 * R 4
 * U 4
 * L 3
 * D 1
 * R 4
 * D 1
 * L 5
 * R 2
 *
 * This represents the steps that H will move in, starting from a position where
 * H and T are on the same tile. To solve the problem, we must follow along and
 * compute T's position after every step, according to the rules of T's motion:
 *
 * 1. If H is ever 2 steps directly up, down, left, or right from T (e.g. after
 * a step), T must move one step in that direction.
 *
 * 2. If H and T aren't adjacent and aren't in the same row or column, T must
 * move one step diagonally to keep up. A crucial point lies in the wording of
 * this, and in the example given:
 * .....    .....    .....
 * .....    .....    .....
 * ..H.. -> ...H. -> ..TH.
 * .T...    .T...    .....
 * .....    .....    .....
 * Notice that we don't move such that we get
 * .....
 * .....
 * ...H.
 * ..T..
 * .....
 * The key is that we MUST move diagonally, so it actually only maps to one
 * motion whenever we're in this situation.
 *
 * After going through all the steps, we have to identify the number of unique
 * tiles that T has visited. We don't care about identifying the tiles
 * themselves (we are given freedom in choosing the frame of reference), just
 * the number of tiles we've visited (which should be invariant regardless of
 * our chosen coordinate system).
 *
 * Algo I'm thinking of:
 *
 * 0. Step 0 would be to set up the data structure for our grid and the H and T
 * objects. We *could* use a 2D array:
 *
 *   a. We can uniquely identify each tile using its index coordinates
 *   (important as we'll have to track the tiles that T has visited)
 *   b. We can implement the rules of motion using index arithmetic
 *
 * We could start with H and T being at some origin indices and give them some
 * leeway to move. However, we'd run into the problem of having to grow the
 * array if H and T start to walk out of bounds.
 *
 * So, here's a trick: what if just don't set up an array at all?
 *
 * We just assign H and T positions on a discrete coordinate system -- we just
 * never represent the actual grid in memory.
 *
 *   a. We don't technically represent each tile on the grid, but we don't have
 *   to; we can just limit our identification to the tiles that H and T actually
 *   visit -- that'd just be their coordinate tuple positions at each point in
 *   time.
 *   b. We can still implement the rules of motion using coordinate arithmetic
 *   -- exactly what we would've done in the above case as well
 *
 * The only real data structures we'd worry about are H and T's coordinate
 * tuples. Much handier! (Note that if we were writing a roguelike, we wouldn't
 * be able to use such a shortcut: we have to render each tile. We have no such
 * constraint to render anything)
 *
 * Last thing to set up would be a Set of tuples so we can remember the
 * coordinates that T has visited.
 *
 * Now that we have that set up, moving forward with the algo:
 *
 * 1. Parse the input line-by-line into an Array of Instructions, which would
 * have a direction and a number of steps.
 * 2. Set up a function to update H's position: given an Instruction and H's
 * current position, output H's new position after the step.
 * 3. Set up a function to update T's position: given H's position after a step
 * and T's current position, output T's new position after the step.
 * 4. Simply apply the functions from steps 2 and 3 above sequentially, going
 * over our Instructions array, to walk the grid. Store T's positions in our set
 * after each step.
 * 5. Once we've exhausted our Instructions array, the size of our set of T's
 * positions should be the number we're looking for.
 *
 * Part 2:
 *
 * This is an interesting extension! Now we have to keep track of a rope with
 * TEN knots, each consecutive pair linked together as head and tail.
 *
 * Because of the way we set up our movePosition and moveTail functions, we
 * don't have to change a thing to compute each consecutive pair's positions.
 * The changes will all be in performInstruction:
 *
 * 4a. It's better to now keep a list of positions, rather than just two (head
 *     and tail).
 * 4b. Instead of a single "move head" and a single "move tail", we now have to
 *     iterate over our list: move the first position as head, then move each
 *     succeeding position as tail to the previous position.
 * 4c. Once all the positions are moved, store the last one in our visited set.
 */

function parseInstruction(line) {
  const [direction, numSteps] = line.split(' ');
  return {
    direction,
    numSteps: Number(numSteps),
  };
}

function parseInstructions(lines) {
  return lines.map(parseInstruction);
}

function parseLines(string) {
  const separatedString = string.charAt(string.length - 1) === '\n'
    ? string.slice(0, string.length - 1)
    : string;

  return separatedString.split('\n');
}

// moves a single step. following an instruction should call this numSteps times
function movePosition(direction, currentPosition) {
  const { x, y } = currentPosition;
  switch (direction) {
    // manually aligning here
    // so it's clear to see that only a single coordinate changes by one
    case 'U': return { x       , y: y + 1 };
    case 'D': return { x       , y: y - 1 };
    case 'R': return { x: x + 1, y        };
    case 'L': return { x: x - 1, y        };
  }
}

function areAdjacent(a, b) {
  const xDistance = Math.abs(a.x - b.x);
  const yDistance = Math.abs(a.y - b.y);

  /**
   * We just want to check if each distance is at most 1.
   *
   * We don't have to think of diagonal distances because even with both
   * xDistance and yDistance non-zero, we can still be adjacent:
   * ....
   * ..H.
   * .T..
   * ....
   */
  return xDistance <= 1 && yDistance <= 1;
}

function moveTail(headPosition, tailPosition) {
  // we don't have to move if we're still adjacent
  if (areAdjacent(headPosition, tailPosition)) return tailPosition;

  /**
   * While technically what we've just guaranteed is that our distance is 2 or
   * greater, because of the way the algorithm is set up (T moves as soon as
   * it's non-adjacent to H, and it *always* catches up), we can actually expect
   * that in the following code blocks, our distance is 2.
   */

  // set up directions, based on whether H is up, down, left, or right of T
  const yDirection = headPosition.y > tailPosition.y ? 'U' : 'D';
  const xDirection = headPosition.x > tailPosition.x ? 'R' : 'L';

  // case: H is in the same column as T. move in the y direction -- up or down
  if (headPosition.x === tailPosition.x) return movePosition(yDirection, tailPosition);

  // case: H is in the same row as T. move in the x direction -- left or right
  if (headPosition.y === tailPosition.y) return movePosition(xDirection, tailPosition);

  // case: H and T are not in the same row or column
  // remember: we MUST move diagonally
  // we have to move once in the y direction and once in the x direction
  const intermediatePosition = movePosition(yDirection, tailPosition);
  const finalPosition = movePosition(xDirection, intermediatePosition);
  return finalPosition;
}

// mutates state
function performInstruction(instruction, state) {
  const { direction, numSteps } = instruction;
  const { positions } = state;

  // NOTE: I'm stubbing out my iteration variable to _ here,
  // because I don't really need to know what step I'm on.
  // I just need to iterate numSteps times
  for (let _ = 0; _ < numSteps; _++) {
    // move the very first head one step
    positions[0] = movePosition(direction, positions[0]);

    // move the rest of our rope, one knot at a time
    for (let i = 1; i < positions.length; i++) {
      // move as a tail one step, with the previous knot as our head
      positions[i] = moveTail(positions[i - 1], positions[i]);
    }

    // remember the very last tail's position
    // use a string key of format x,y for convenience
    const { x, y } = positions[positions.length - 1];
    state.visited.add(`${x},${y}`);
  }
}

// mutates state
function performInstructions(instructions, state) {
  for (const instruction of instructions) {
    performInstruction(instruction, state);
  }
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);
  const instructions = parseInstructions(lines);

  // define our initial state
  const state = {
    // initialize 10 positions, all starting at (0, 0)
    positions: Array.from({ length: 10 }, () => ({ x: 0, y: 0 })),
    visited: new Set(),
  };

  // perform instructions, mutating state along the way
  performInstructions(instructions, state);

  // print the result
  console.log(state.visited.size);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
