import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as dotenv from 'dotenv';
import serviceAccount from './serviceAccount.json';

dotenv.config();

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  });
}

async function main() {
  const root = await getDatabase().ref('/').once('value');
  const val = root.val();
  console.log('Top-level keys:', val ? Object.keys(val) : '(empty)');
  if (val) {
    for (const k of Object.keys(val)) {
      const child = val[k];
      if (child && typeof child === 'object') {
        const keys = Array.isArray(child) ? `[array length ${child.length}]` : Object.keys(child);
        console.log(`  /${k} →`, keys);
        // se for objeto, mostrar 1 nível abaixo
        if (!Array.isArray(child)) {
          for (const k2 of Object.keys(child)) {
            const c2 = child[k2];
            if (c2 && typeof c2 === 'object') {
              const k2s = Array.isArray(c2) ? `[array length ${c2.length}]` : Object.keys(c2);
              console.log(`    /${k}/${k2} →`, k2s);
            } else {
              console.log(`    /${k}/${k2} →`, c2);
            }
          }
        }
      } else {
        console.log(`  /${k} →`, child);
      }
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
