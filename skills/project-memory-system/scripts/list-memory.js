#!/usr/bin/env node
"use strict";

const {
  filterMemories,
  listMemories,
  parseArgs,
  printList,
  resolveRoot
} = require("./memory-utils");

const args = parseArgs(process.argv.slice(2));
let root;
try {
  root = resolveRoot(args.root);
} catch (error) {
  console.error(error.message);
  console.error("Usage: node scripts/list-memory.js [query] --root <project-root> [--json]");
  process.exit(1);
}
const query = args._.join(" ");
const memories = filterMemories(listMemories(root), query);

printList(memories, root, args.json);
