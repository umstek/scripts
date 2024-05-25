#!/usr/bin/env bun

import { $ } from 'bun';

const [, , scriptName = 'fallback', ...args] = process.argv;

await $`cd packages/${scriptName} && bun start -- ${args.join(' ')}`;
