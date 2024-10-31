import { mkdirp, writeFile } from 'fs-extra';
import type { CookieJar } from 'tough-cookie';
import path from 'node:path';
import { URL } from 'node:url';

interface DownloadWebPageOptions {
  url: string;
  jar: CookieJar;
  filePath?: string;
}

export function urlToFilePath(url: string): string {
  const urlObj = new URL(url);
  return path.join(
    process.cwd(),
    urlObj.hostname,
    `${urlObj.pathname.replace(/\//g, '_')}.html`,
  );
}

export async function downloadWebPage({
  url,
  jar,
  filePath = urlToFilePath(url),
}: DownloadWebPageOptions) {
  const response = await fetch(url, {
    headers: { cookie: await jar.getCookieString(url) },
  });
  const text = await response.text();
  //   if (!response.ok) {
  //     throw new Error(text);
  //   }
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    for (const cookie of cookies) {
      await jar.setCookie(cookie, url);
    }
  }

  await mkdirp(path.dirname(filePath));
  await writeFile(filePath, text, 'utf8');
  return filePath;
}
