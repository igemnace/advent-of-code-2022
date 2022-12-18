const { promises: fs } = require('fs');

/**
 * No Space Left On Device
 *
 * Input is in the format of a mock terminal session:
 * $ cd /
 * $ ls
 * dir a
 * 14848514 b.txt
 * 8504156 c.dat
 * dir d
 * $ cd a
 * $ ls
 * dir e
 * 29116 f
 * 2557 g
 * 62596 h.lst
 * $ cd e
 * $ ls
 * 584 i
 * $ cd ..
 * $ cd ..
 * $ cd d
 * $ ls
 * 4060174 j
 * 8033020 d.log
 * 5626152 d.ext
 * 7214296 k
 *
 * Problem is to infer the FS tree from the above, find the directories
 * containing files with sizes totalling at most 100,000, then sum those sizes
 * together.
 *
 * This one is yet another parsing-heavy problem like Day 5, I believe. Parsing
 * algo I'm thinking of:
 *
 * 0. Keep a representation of the filesystem in memory (I'm thinking a File
 * semantic type that is essentially a tree node, with type: 'file' |
 * 'directory'). Also keep the current working directory in memory. This is step
 * 0, as this is setup for the first step.
 * 1. Go down the terminal input line-by-line.
 * 2. Use the leading "$ " as the sentinel value for commands.
 * 3. Set up functions for handling each command (yeehaw, we're parsing shell...
 * at least it's extremely minimal, no quoting or anything):
 *   a. cd: change the current working directory to its argument.
 *   b. ls: parse all following lines until the next command as contents of the
 *   current working directory, storing in our FS representation along with size
 *   and type.
 *
 * Once that's all done, we should be left with the entire tree, on which we can
 * operate. Algo for finding directories I'm thinking of:
 *
 * 1. Traverse the File tree dir-by-dir. I'm thinking depth-first traversal
 * here, just so I don't have to remember unexplored nodes. I'll also need a
 * dir's size in order to compute its parent dir's size, so depth-first makes
 * sense.
 * 2. For each dir, compute its size by summing up the sizes of its contents.
 * Store this in its File node as well, so it can be used in its parent dir's
 * size computation.
 * 3. If a dir has a size that matches the condition, keep it in memory. I'm
 * thinking a simple Array would actually be the data structure for the job
 * here: the only optimizations needed are for insertion and traversal (later
 * when we sum the sizes), which an Array can handle perfectly.
 */

function parseLines(string) {
  const separatedString = string.charAt(string.length - 1) === '\n'
    ? string.slice(0, string.length - 1)
    : string;

  return separatedString.split('\n');
}

function parseFileNode(line) {
  // stat can either be literal "dir" or a file size
  const [stat, name] = line.split(' ');

  const node = {
    name,
    type: stat === 'dir' ? 'directory' : 'file',
  };
  if (stat !== 'dir') node.size = Number(stat);

  return node;
}

const commandRegex = /\$ (\w+)( (.+))?/;
// mutates state
function parseShellCommands(lines, state) {
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    // use regex capture groups to tokenize
    // this has very rigid syntax assumptions:
    // only suited for this problem, not for shell parsing in general
    const [_, command, __, arg] = commandRegex.exec(line);

    switch (command) {
      case 'ls': {
        // we slurp all the next lines until we hit another command
        // notice that we advance index as well, because our main parse loop
        // will start off *after* all the slurped ls output
        let nextLine = lines[++index];
        while (nextLine && nextLine.charAt(0) !== '$') {
          const node = parseFileNode(nextLine);

          // attach as child of cwd
          node.parent = state.cwd;
          if (!state.cwd.children) state.cwd.children = new Map();
          state.cwd.children.set(node.name, node);

          // move forward to the next line
          nextLine = lines[++index];
        }

        break;
      }
      case 'cd': {
        // special case: / (only absolute path I'm supporting)
        if (arg === '/') state.cwd = state.root;
        // special case: ..
        else if (arg === '..') state.cwd = state.cwd.parent;
        // general case: cd into a child node
        else state.cwd = state.cwd.children.get(arg);

        // increment the index to parse the next line
        index++;
        break;
      }
    }
  }
}

// NOTE: mutates dirs by adding a size
/**
 * TODO: dafuq? this does NOT feel elegant
 * - what the fuck is the name for what i'm doing? "small dirs" sounds weird now
 * - feels like an unholy, non-standard version of a recursive function
 * - casing feels weird. why do I have to do if (node.children) for traversing,
 *   then compute node.size with the same condition afterwards? there must be a
 *   more elegant way
 *
 * TODO: now that i've seen part 2, i think a nicer way would be to compute size
 * incrementally during parsing. that's actually similar to how df does it
 */
function findSmallDirs(sizeUpperBound, node, { big } = {}) {
  if (node.type !== 'directory') return [];
  const smallDirs = [];

  // let's go depth-first, so we compute size for leaf dirs
  if (node.children) {
    const childrenSmallDirs = Array.from(node.children.values())
      .flatMap(child => findSmallDirs(sizeUpperBound, child, { big }));
    smallDirs.push(...childrenSmallDirs);
  }

  // compute current node's size
  node.size = node.size ?? (node.children
    ? Array.from(node.children.values()).reduce((sum, c) => sum + c.size, 0)
    : 0);

  // FIXME FIXME FIXME
  if (big) {
    if (node.size >= sizeUpperBound) smallDirs.push(node);
  } else {
    if (node.size <= sizeUpperBound) smallDirs.push(node);
  }

  return smallDirs;
}

// TODO: fuck it, clean this up afterwards
async function main() {
  const input = await fs.readFile('./data', { encoding: 'utf8' });
  const lines = parseLines(input);

  // parse step 0: initialize FS tree
  const root = { name: '/', type: 'directory' };
  const state = { root, cwd: root };

  // mutate state: fill up the FS tree
  parseShellCommands(lines, state);

  // find dirs smaller than 100,000
  const smallDirs = findSmallDirs(100000, state.root);

  // part 2
  // FIXME: lmfaoooooooo
  const bigDirs = findSmallDirs(30000000 - (70000000 - state.root.size), state.root, { big: true });

  // print the result
  // TODO: man... i already do this within findSmallDirs. i feel like my brain
  // is at 50% efficiency with COVID...
  // FIXME FIXME FIXME
  console.log(bigDirs.sort((a, b) => a.size - b.size).shift().size);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
