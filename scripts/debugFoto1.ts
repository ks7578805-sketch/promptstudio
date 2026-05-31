import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();
const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccount.json', 'utf-8'));
if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });

async function main() {
  const snap = await getFirestore().collection('prompts').doc('p1').get();
  const data = snap.data();
  if (!data) { console.log('p1 not found'); return; }

  const text = [data.title ?? '', data.prompt ?? '', ...(data.tags ?? [])].join(' ').toLowerCase();
  const idx = text.indexOf('uma mulher');
  const idxAlt = text.indexOf('mulher');

  console.log('Title:', JSON.stringify(data.title));
  console.log('Tags:', JSON.stringify(data.tags));
  console.log('Prompt first 100:', JSON.stringify((data.prompt ?? '').slice(0, 100)));
  console.log('text.indexOf("uma mulher"):', idx);
  console.log('text.indexOf("mulher"):', idxAlt);
  console.log('Test /\\buma mulher\\b/:', /\buma mulher\b/.test(text));
  console.log('Test /\\ba woman\\b/:', /\ba woman\b/.test(text));
  if (idxAlt > -1) {
    const ctx = text.slice(Math.max(0, idxAlt - 10), idxAlt + 16);
    const codes = [...ctx].map(c => c.charCodeAt(0).toString(16)).join(' ');
    console.log('Context around "mulher":', JSON.stringify(ctx));
    console.log('Char codes:', codes);
  }
}
main().catch(console.error);
