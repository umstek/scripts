import { setTimeout } from 'node:timers/promises';
import open from 'open';

const deviceCodeResponse = await fetch('https://github.com/login/device/code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    client_id: process.env.GITHUB_APP_CLIENT_ID,
    scope: 'admin:org, repo, delete_repo, public_repo, user',
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

for (
  const startTime = Date.now();
  startTime + expires_in * 1000 > Date.now();
) {
  console.log('Waiting for you to enter the code...');
  await setTimeout(interval * 1000);

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
          client_id: process.env.GITHUB_APP_CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      },
    );

    const { access_token } = await response.json();

    if (access_token) {
      console.log('Access token:', access_token);
      break;
    }

    console.log('No access token found. ');
  } catch (error) {
    console.error(error);
  }
}
