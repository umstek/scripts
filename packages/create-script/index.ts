import { cp, readFile, writeFile } from 'node:fs/promises';
import { $, Glob } from 'bun';
import prompts from 'prompts';

const { scriptName }: { scriptName: string } = await prompts({
  type: 'text',
  name: 'scriptName',
  message: 'What is the name of the script you want to create (in kebab-case)?',
});

// Copy data folder into script-name folder
const dest = `../${scriptName}`;
await cp('./data', dest, { recursive: true });

// Search and replace {script-name} with scriptName
const glob = new Glob('*');
for await (const file of glob.scan(dest)) {
  const content = await readFile(`${dest}/${file}`, 'utf8');
  const newContent = content.replace('{script-name}', scriptName);
  await writeFile(`${dest}/${file}`, newContent, 'utf8');
}

await $`cd ../.. && bun add ${scriptName}@workspace:packages/${scriptName}`;
