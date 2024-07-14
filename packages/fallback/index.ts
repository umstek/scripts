import os from 'node:os';
import path from 'node:path';
import { $ } from 'bun';
import OpenAI from 'openai';
import prompts from 'prompts';

const homeDir = os.homedir();

const currentShellType =
  (process.env.SHELL || '/usr/bin/bash').split('/').at(-1) || 'bash';
const paths = new Map([
  ['bash', path.join(homeDir, '.bash_history')],
  ['zsh', path.join(homeDir, '.zsh_history')],
  ['sh', path.join(homeDir, '.history')],
]);
// Prioritize provided history file, or get the default one.
const defaultHistoryFilePath =
  process.env.HISTFILE || paths.get(currentShellType) || '';
// Place defaultHistoryFilePath at the top, but also consider others.
paths.delete(currentShellType);
const historyFile = [defaultHistoryFilePath, ...paths.values()]
  .map((p) => Bun.file(p))
  .find((f) => f.exists());
if (!historyFile) {
  throw new Error('No history file found');
}

const history = await historyFile.text();
const historyLines = history.split('\n');
let lastCommand = historyLines.at(-2);
if (lastCommand === 's' || lastCommand?.endsWith(';s')) {
  lastCommand = historyLines.at(-3);
}
if (!lastCommand) {
  throw new Error('No last command found');
}
// Strip other things attached by zsh
lastCommand = lastCommand.replace(/^: \d+:\d+;/, '');

const api = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: process.env.GROQ_API_KEY,
  // baseURL: 'https://api.groq.com/openai/v1',
});
const re = await api.chat.completions.create({
  model: process.env.AI_CHAT || 'gpt-4o',
  messages: [
    {
      role: 'system',
      content:
        'You are a helpful assistant who corrects mistyped commands on terminal. For each command, you should only respond with the corrected command. If you do not know the command, respond with "Unknown command".',
    },
    { role: 'user', content: lastCommand },
  ],
  max_tokens: 50,
});

const command = re.choices[0].message?.content || 'Unknown command';

if (command === 'Unknown command') {
  console.error('Unknown command');
  process.exit(1);
}

const { selectedCommand } = await prompts({
  message: 'Select command',
  name: 'selectedCommand',
  type: 'select',
  choices: [
    {
      title: command,
      value: command,
    },
    {
      title: lastCommand,
      value: lastCommand,
    },
  ],
});

if (!selectedCommand) {
  throw new Error('No command selected');
}

await $`${currentShellType} -c "${selectedCommand}"`;
