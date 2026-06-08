#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "target"
]);

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--root") {
      args.root = argv[i + 1];
      i += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg.startsWith("--root=")) {
      args.root = arg.slice("--root=".length);
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function resolveRoot(rootArg) {
  if (!rootArg) {
    throw new Error("Missing required --root <project-root> argument.");
  }
  return path.resolve(rootArg);
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relativePath(root, filePath) {
  const rel = path.relative(root, filePath);
  return rel ? toPosix(rel) : ".";
}

function isInsideRoot(root, targetPath) {
  const rel = path.relative(root, targetPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function isMemoryFile(filePath) {
  return path.basename(filePath) === "memory.md";
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_error) {
    return "";
  }
}

function titleFromMarkdown(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function walk(dir, result) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_error) {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walk(fullPath, result);
      }
    } else if (entry.isFile() && entry.name === "memory.md") {
      result.push(fullPath);
    }
  }
}

function listMemories(root) {
  const files = [];
  walk(root, files);
  files.sort((a, b) => relativePath(root, a).localeCompare(relativePath(root, b)));

  return files.map((filePath) => {
    const rel = relativePath(root, filePath);
    const dir = path.dirname(rel) === "." ? "." : path.dirname(rel);
    const content = safeRead(filePath);
    return {
      path: rel,
      directory: dir,
      depth: rel === "memory.md" ? 0 : rel.split("/").length - 1,
      title: titleFromMarkdown(content)
    };
  });
}

function filterMemories(memories, query) {
  if (!query) return memories;
  const normalized = query.toLowerCase();
  return memories.filter((memory) => {
    return (
      memory.path.toLowerCase().includes(normalized) ||
      memory.directory.toLowerCase().includes(normalized) ||
      memory.title.toLowerCase().includes(normalized)
    );
  });
}

function findNearestChain(root, target) {
  const targetPath = path.resolve(root, target || ".");
  const rootResolved = path.resolve(root);
  const relToRoot = path.relative(rootResolved, targetPath);

  if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
    throw new Error(`Target is outside root: ${target}`);
  }

  let current = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()
    ? path.dirname(targetPath)
    : targetPath;
  const chain = [];

  while (isInsideRoot(rootResolved, current)) {
    const candidate = path.join(current, "memory.md");
    if (fs.existsSync(candidate)) {
      chain.unshift({
        path: relativePath(rootResolved, candidate),
        directory: relativePath(rootResolved, current),
        depth: relativePath(rootResolved, candidate) === "memory.md"
          ? 0
          : relativePath(rootResolved, candidate).split("/").length - 1,
        title: titleFromMarkdown(safeRead(candidate))
      });
    }

    if (current === rootResolved) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return chain;
}

function resolveMemory(root, query) {
  const rootResolved = path.resolve(root);

  if (!query) {
    const rootMemory = path.join(rootResolved, "memory.md");
    if (fs.existsSync(rootMemory)) return rootMemory;
    return null;
  }

  const direct = path.resolve(rootResolved, query);
  if (!isInsideRoot(rootResolved, direct)) {
    return { matches: [] };
  }

  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) {
    return isMemoryFile(direct) ? direct : { matches: [] };
  }

  const directMemory = path.join(direct, "memory.md");
  if (isInsideRoot(rootResolved, directMemory) && fs.existsSync(directMemory)) {
    return directMemory;
  }

  const matches = filterMemories(listMemories(root), query);
  if (matches.length === 1) {
    return path.join(rootResolved, matches[0].path);
  }

  return { matches };
}

function printList(memories, root, json) {
  if (json) {
    console.log(JSON.stringify({ root, memories }, null, 2));
    return;
  }

  if (memories.length === 0) {
    console.log(`No memory.md files found under ${root}`);
    return;
  }

  console.log(`Memory files under ${root}:`);
  for (const memory of memories) {
    const title = memory.title ? ` | ${memory.title}` : "";
    console.log(`- ${memory.path} | depth ${memory.depth}${title}`);
  }
}

module.exports = {
  filterMemories,
  findNearestChain,
  listMemories,
  parseArgs,
  printList,
  relativePath,
  resolveMemory,
  resolveRoot,
  safeRead
};
