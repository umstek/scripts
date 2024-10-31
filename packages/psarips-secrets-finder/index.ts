import { writeFile, readFile, pathExists } from 'fs-extra';
import { CookieJar } from 'tough-cookie';

import { downloadWebPage, urlToFilePath } from './fetcher.js';
import {
  parseDownloadUrl,
  parseItemPageHtmlFile,
  parseRedirectPageHtmlFile,
} from './parser.js';

const cookieFilePath = './cookies.json';

async function loadCookies(filePath: string): Promise<CookieJar> {
  if (await pathExists(filePath)) {
    try {
      const cookiesData = await readFile(filePath, 'utf8');
      const cookies = JSON.parse(cookiesData);
      const deserializedJar = await CookieJar.deserialize(cookies);
      console.log('Cookies loaded from file');
      return deserializedJar;
    } catch (err) {
      console.error('Error loading cookies:', err);
    }
  }
  return new CookieJar();
}

const jar = await loadCookies(cookieFilePath);

const url = 'https://psa.wf/tv-show/special-ops-lioness/';
const targetFilePath = urlToFilePath(url);
let filePath: string;
if (await pathExists(targetFilePath)) {
  filePath = targetFilePath;
  console.log('Page already downloaded.');
} else {
  filePath = await downloadWebPage({
    url,
    jar,
  });
  console.log('Page downloaded.');
}

try {
  const serializedJar = await jar.serialize();
  await writeFile(
    cookieFilePath,
    JSON.stringify(serializedJar, null, 2),
    'utf8',
  );
  console.log(`Cookies saved to ${cookieFilePath}`);
} catch (err) {
  console.error('Error:', err);
}

const linkInfo = await parseItemPageHtmlFile(filePath);
const downloadInfo = linkInfo.map(({ link, type, description }) => {
  const { id, token, index, md5 } = parseDownloadUrl(link);
  return {
    id,
    token,
    index,
    md5,
    link,
    type,
    description,
  };
});

console.log(downloadInfo[0]);

const itemUrl = downloadInfo[0].link;
const itemFilePath = urlToFilePath(itemUrl);
if (await pathExists(itemFilePath)) {
  console.log('Item page already downloaded.');
} else {
  await downloadWebPage({ url: itemUrl, jar });
}

const scriptContent = await parseRedirectPageHtmlFile(itemFilePath);
const baseUrl = 'https://psa.wf';
const cloudflareResistancePolyfillUrl = `

function evalInContext(js, context) {
  return function() {
    return eval(js);
  }.call(context);
}

global.window = {
  _cf_chl_opt: {},
  location: {
    hash: '${itemUrl.split('#')[1]}',
    href: '${itemUrl}',
    pathname: '${itemUrl.split('/').slice(3, -1).join('/')}',
    search: '${itemUrl.split('?')[1]}',
  },
  history: {
    replaceState: (state, title, url) => {
      console.log(\`History replaced with URL: \${url}\`);
    },
  },
};

global.location = global.window.location;
global.history = global.window.history;

// Polyfill for document object
global.document = {
  createElement: (tagName) => {
    if (tagName === 'script') {
      return {
        set src(value) {
          console.log(\`Script src set to: \${value}\`);
          fetch(\`${baseUrl}/\${value}\`)
            .then(response => response.text())
            .catch(err => console.error('Error loading script:', err))
            .then(text => {
              console.log('script loaded', text);
              evalInContext(text, global);
              this.onload();
            });
        },
      };
    }
    return {};
  },
  getElementsByTagName: () => [{ appendChild: () => {} }],
};


`;

const fullScriptContent = `${cloudflareResistancePolyfillUrl}\n${scriptContent}`;

const cfScript = new Function(fullScriptContent);

console.log(cfScript);

console.log(cfScript());
