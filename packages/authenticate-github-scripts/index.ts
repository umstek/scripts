import { setInterval } from 'node:timers/promises';
import open from 'open';

const deviceCodeResponse = await fetch('https://github.com/login/device/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    client_id: process.env.GITHUB_SCRIPTS_CLIENT_ID,
    scope: 'repo, public_repo, user',
  }),
});

if (!deviceCodeResponse.ok) {
  const { message, error } = await deviceCodeResponse.json();
  throw new Error(error || message);
}

const { device_code, user_code, verification_uri, expires_in, interval } =
  await deviceCodeResponse.json();

console.log(
  `Please go to ${verification_uri} with your browser and enter the code ${user_code} to continue.`,
);

await open(verification_uri);

const ac = new AbortController();
// Interval is the minimum wait time to ask for an access token
for await (const startTime of setInterval(interval * 1000, Date.now(), {
  signal: ac.signal,
})) {
  const now = Date.now();
  if (now - startTime > expires_in * 1000) {
    ac.abort();
    break;
  }

  console.log('Waiting for device code to be validated...');

  try {
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_SCRIPTS_CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      },
    );

    const { access_token } = await response.json();

    if (access_token) {
      console.log('Access token:', access_token);
      ac.abort();
      break;
    }
  } catch (error) {
    console.error(error);
  }
}
