#!/usr/bin/env bun

import { $ } from 'bun';

const [, , scriptName, ...args] = process.argv;

if (!scriptName) {
  console.error('No script specified');
  process.exit(1);
}

await $`cd packages/${scriptName} && bun start -- ${args.join(' ')}`;
