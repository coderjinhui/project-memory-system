#!/usr/bin/env node
"use strict";

const {
  findNearestChain,
  parseArgs,
  printList,
  resolveRoot
} = require("./memory-utils");

const args = parseArgs(process.argv.slice(2));
const target = args._[0];

if (!target) {
  console.error("Usage: node scripts/find-memory.js <module-path-or-file> --root <project-root> [--json]");
  console.error("Example: node scripts/find-memory.js src/workflow/nodes/conditions --root /path/to/project");
  process.exit(1);
}

let root;
try {
  root = resolveRoot(args.root);
} catch (error) {
  console.error(error.message);
  console.error("Usage: node scripts/find-memory.js <module-path-or-file> --root <project-root> [--json]");
  process.exit(1);
}

try {
  const chain = findNearestChain(root, target);
  printList(chain, root, args.json);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
