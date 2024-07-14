import { readFile } from 'fs-extra';

async function extractStrings(
  filePath: string,
  regex: RegExp,
): Promise<string[]> {
  const buffer = await readFile(filePath);
  const content = buffer.toString('latin1');

  const extractedStrings: string[] = [];

  for (const match of content.matchAll(regex)) {
    extractedStrings.push(match[0]);
  }

  return extractedStrings;
}

const filePath = '/path/to/file.bin';
const regex = /(?<=v\x85)([0-9A-F]{4}\s?)+/g;
const strings = await extractStrings(filePath, regex);

strings.forEach((str, index) => {
  console.log(str);
});
