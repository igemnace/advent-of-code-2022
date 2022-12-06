const { promises: fs } = require('fs');

/**
 * Tuning Trouble
 *
 * Input is a single string, representing characters in a data stream:
 * mjqjpqmgbljsphdztnvjfqwrcgsmlb
 *
 * Problem is to find a start-of-packet marker made of four characters that are
 * all different.
 *
 * Algo I'm thinking of:
 *
 * 1. Run through the string, character-by-character
 * 2. Keep a buffer of the last 4 characters processed.
 * 3. Check if the buffer is made of all unique characters. If so, we're done.
 * If not, move on to the next character.
 *
 * My choice of data structure for the buffer will be crucial, because I want to
 * optimize for:
 * - FIFO insertion
 * - checking for uniqueness
 *
 * Set would be pretty nice for performing the uniqueness check easily: just
 * push in the characters and check that its size is 4. I might actually just
 * rebuild a Set every iteration -- we get the overhead for building the Set
 * (that's O(n) at least), but it's constrained to always be at most 4
 * characters so I think I'm fine with it.
 */

// NOTE: finds the *trailing* edge of the marker, as asked for by the problem
function findStartOfPacketMarker(string) {
  for (let i = 0; i < string.length; i++) {
    // compute the lower bound up-front
    // because String#slice treats negative indices as offsets from the end
    const lowerBound = Math.max(0, i - 3);
    const buffer = new Set(string.slice(lowerBound, i + 1));

    if (buffer.size === 4) return i;
  }

  // if no marker is found, return -1 to mirror the typical JS findIndex methods
  return -1;
}

async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const markerIndex = findStartOfPacketMarker(input);

  // print result: we want the ordinal number, not the index, so we do +1
  console.log(markerIndex + 1);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
