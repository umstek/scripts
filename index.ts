import { $ } from 'bun';

const [, , scriptName, ...args] = process.argv;

await $`cd packages/${scriptName} && bun start -- ${args.join(' ')}`;
