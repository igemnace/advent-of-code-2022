const { promises: fs } = require('fs');

/**
 * Supply Stacks
 *
 * Part 1:
 *
 * Input is in the following format:
 *     [D]    
 * [N] [C]    
 * [Z] [M] [P]
 *  1   2   3 
 *
 * move 1 from 2 to 1
 * move 3 from 1 to 3
 * move 2 from 2 to 1
 * move 1 from 1 to 2
 *
 * The first half is a visual representation of a number of stacks, each with
 * crates marked by a single letter.
 *
 * The second half is a set of steps, e.g. "move 1 crate from stack 2 to stack
 * 1".
 *
 * Problem is to figure out which crates end up on the top of each stack, after
 * all the steps in the rearrangement are done. 
 *
 * This one is a harder nut to crack, parsing-wise, as there's much more going
 * on than just "parse each line into X".
 *
 * Parse algo I'm thinking of, I'll split into two sections: the stacks parsing,
 * and the instructions parsing. I'll use the empty line to separate the two.
 *
 * A. Stacks parsing: I'm thinking of using fixed-width offsets here, actually.
 * Characters 1-3 are stack 1, 5-7 are stack 2, etc. I think steering clear of
 * any String#split tokenization is the right idea, so I can still go over the
 * thing line-by-line (even the ones that have no crates at that level for some
 * stacks) without losing track of which stack a crate belongs to.
 *
 * I'd like to keep it simple and parse this all into an Array of stacks.
 *
 * Btw, eventually I'll end up with the line with stack names ("1 2 3" etc),
 * which honestly I'll just discard for the moment to makes things simpler -- we
 * can infer stack numbers from their order anyway.
 *
 * B. Instructions parsing: This is a lot easier, and more in line with previous
 * days' parsing. Simply turn each line into an Instruction type, with:
 * - numToMove: the number of crates to move
 * - from: from which stack (indexed from 1)
 * - to: to which stack (indexed from 1)
 *
 * Once all that's parsed out, it's time for the rearrangement algo:
 *
 * 1. Set up a function to move just 1 crate between two stacks: pop from the
 * "from" stack, then push to the "to" stack.
 * 2. Problem dictates that instructions moving more than 1 crate have to do so
 * one-by-one, so any Instruction that has numToMove > 1 will actually just call
 * the above move function numToMove times. Easy!
 * 3. Simply go through each Instruction in order and apply the above.
 *
 * Part 2:
 *
 * Now, rearrangement happens by moving crates at the same time. Previously,
 * having an Instruction with numToMove > 1 meant having to move crates
 * one-by-one. This impacts the output, as moving one-by-one reverses the order
 * of the moved crates.
 *
 * Amendment would really just be for step 2 above, which is implemented in our
 * performInstruction function. We have to be mindful of the order here. Take
 * the following example from the problem:
 * [D]        
 * [N] [C]    
 * [Z] [M] [P]
 *  1   2   3
 *
 * In this state, if we perform a "move 3 from 1 to 3" instruction, the result
 * must be:
 *        [D]
 *        [N]
 *    [C] [Z]
 *    [M] [P]
 * 1   2   3
 *
 * Notice that D is the first one to be popped, but it must be pushed to stack 3
 * last. The semantics is First In, Last Out -- basically just a Stack as well!
 *
 * So the idea in performInstruction now will be:
 *
 * 2a. Pop off numToMove elements from the "from" stack into a temporary stack.
 * 2b. Once all elements are popped, pop each element in the temporary stack
 * straight into the "to" stack.
 */

/***********
 * PARSING *
 ***********/

class Stack {
  constructor(...elements) {
    this.data = elements ?? [];
  }

  push(element) {
    this.data.push(element);
  }

  pop(element) {
    return this.data.pop(element);
  }

  peek() {
    return this.data[this.data.length - 1];
  }
}

function parseStacks(lines) {
  // this will be an Array of Stacks
  const stacks = [];

  // let's parse bottom to top, so we push to the stacks in the right order

  // I don't actually know the time complexity of Array#reverse!
  // if I were to implement it, I would implement naively using a copy, to
  // trade space for time complexity, but the Array#reverse likely needs to be
  // general and is implementation-specific. anyhow, the stacks come up in
  // natural order this way, so I'll bite the bullet
  for (const line of [...lines].reverse()) {
    for (let offset = 0; offset < line.length; offset += 4) {
      const stackIndex = offset / 4;

      // jump across a fixed-width offset of 4
      // since it's 3 characters for a crate (e.g. "[A]"), plus a separating space
      if (line.charAt(offset) === '[') {
        // a crate is found
        if (!stacks[stackIndex]) stacks[stackIndex] = new Stack();
        stacks[stackIndex].push(line.charAt(offset + 1));
      }
    }
  }

  return stacks;
}

const instructionStringRegex = /move (\d+) from (\d+) to (\d+)/;
function parseInstruction(line) {
  // use regex capturing groups to easily parse out the numbers
  const [_, numToMove, from, to] = instructionStringRegex.exec(line);

  return {
    numToMove: Number(numToMove),
    from: Number(from),
    to: Number(to),
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

function parseStacksAndInstructions(lines) {
  // find the empty line separating the stacks part from the instructions part
  const separatorIndex = lines.findIndex(line => line === '');

  return {
    // use separatorIndex - 1 as end boundary
    // because we also want to discard the line with stack names ("1 2 3" etc)
    stacks: parseStacks(lines.slice(0, separatorIndex - 1)),

    // instructions start after the separator, so separatorIndex + 1
    instructions: parseInstructions(lines.slice(separatorIndex + 1)),
  };
}

/*****************
 * REARRANGEMENT *
 *****************/

// mutates stacks
function performInstruction(instruction, stacks) {
  const tempStack = new Stack();

  // 2a: pop off elements into the temp stack
  for (let i = 0; i < instruction.numToMove; i++) {
    // "from" is a 1-based index, so we have to do -1
    const element = stacks[instruction.from - 1].pop();
    tempStack.push(element);
  }

  // 2b: push elements into the "to" stack
  while (tempStack.peek()) {
    const element = tempStack.pop();
    // "to" is a 1-based index, so we have to do -1
    stacks[instruction.to - 1].push(element);
  }
}

// mutates stacks
function performInstructions(instructions, stacks) {
  for (const instruction of instructions) {
    performInstruction(instruction, stacks);
  }
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);
  const { stacks, instructions } = parseStacksAndInstructions(lines);

  // perform all instructions, mutating stacks along the way
  // we could technically do this non-mutatively but we'll rebuild the stacks
  // every time... we save so much more on overhead this way
  performInstructions(instructions, stacks);

  // print result: should be the crates concat'd together, e.g. CMZ
  console.log(stacks.map(stack => stack.peek()).join(''));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
