#!/usr/bin/env node
"use strict";

const path = require("path");
const {
  parseArgs,
  printList,
  relativePath,
  resolveMemory,
  resolveRoot,
  safeRead
} = require("./memory-utils");

const args = parseArgs(process.argv.slice(2));
const query = args._.join(" ");
let root;
try {
  root = resolveRoot(args.root);
} catch (error) {
  console.error(error.message);
  console.error("Usage: node scripts/get-memory.js [memory-path-or-module] --root <project-root> [--json]");
  process.exit(1);
}
const resolved = resolveMemory(root, query);

if (!resolved) {
  console.error(`No memory.md found under ${root}`);
  process.exit(1);
}

if (resolved.matches) {
  if (resolved.matches.length === 0) {
    console.error(`No matching memory.md found for "${query}" under ${root}`);
  } else {
    console.error(`Multiple memory.md files match "${query}". Use an exact path:`);
    printList(resolved.matches, root, false);
  }
  process.exit(1);
}

const rel = relativePath(root, resolved);
if (args.json) {
  console.log(JSON.stringify({
    root,
    path: rel,
    content: safeRead(resolved)
  }, null, 2));
} else {
  console.log(`<!-- memory: ${rel} -->`);
  console.log(safeRead(path.resolve(resolved)));
}
