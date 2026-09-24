import { generateVapidKeys } from '../netlify/lib/webpush.mjs';

// A new key pair for the daily reminders, printed rather than saved so the private half
// never lands in a file that could be committed. Set each value in Netlify under Site
// configuration -> Environment variables, in the scopes noted, then deploy.
//
// Make a pair once and keep it. A replacement leaves every browser's subscription
// undeliverable until that browser opens the app again and subscribes anew.
const { publicKey, privateKey } = generateVapidKeys();

console.log(`# Builds: where the app turns reminders on and off.
VITE_PUSH_ENDPOINT=/.netlify/functions/push

# Builds and Functions: the app subscribes with this, and the functions check the private key against it.
VITE_VAPID_PUBLIC_KEY=${publicKey}

# Functions only, marked secret: signs every reminder. Never give it a VITE_ prefix or commit it.
VAPID_PRIVATE_KEY=${privateKey}

# Functions only: how push services can reach whoever runs the site, as a mailto: address
# or an https:// page such as the support page. Fill it in.
VAPID_SUBJECT=`);
