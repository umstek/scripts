import { load } from 'cheerio';
import { readFile } from 'fs-extra';

type LinkInfo = { link: string; description: string; type: string };

/**
 * Parse an HTML file for a tv series or a movie and return an array of link information.
 * @param filePath - The path to the HTML file.
 * @returns An array of link information.
 */
export async function parseItemPageHtmlFile(filePath: string) {
  const htmlContent = await readFile(filePath, 'utf-8');
  const $ = load(htmlContent);
  const linkInfo: LinkInfo[] = [];

  $('a[href^="https://psa.wf/goto/"]').each((_index, element) => {
    const link = $(element).attr('href');
    const type =
      $(element).text().trim().toLowerCase() === 'download'
        ? 'direct'
        : 'torrent';
    const description = $(element)
      .closest('.sp-body')
      .prev('.sp-head')
      .text()
      .trim();
    if (link) {
      linkInfo.push({ link, description, type });
    }
  });

  return linkInfo;
}

export function parseDownloadUrl(url: string) {
  const urlContent = url.replace('https://psa.wf/goto/', '');
  const [id] = urlContent.split('/', 1);
  const [token, index, md5] = urlContent.replace(`${id}/`, '').split(':');
  return { id, token, index, md5 };
}

export async function parseRedirectPageHtmlFile(filePath: string) {
  const htmlContent = await readFile(filePath, 'utf-8');
  const $ = load(htmlContent);
  const scriptContent = $('script').text();
  return scriptContent;
}
