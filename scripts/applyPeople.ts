import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccount.json', 'utf-8'));

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const firestore = getFirestore();

interface Prompt {
  id: string;
  title: string;
  prompt: string;
  tags?: string[];
  peopleCount?: number;
}

function detectPeopleCount(prompt: Prompt): number | undefined {
  const text = [
    prompt.title ?? '',
    prompt.prompt ?? '',
    ...(prompt.tags ?? []),
  ].join(' ').replace(/\s+/g, ' ').toLowerCase();

  if (
    /\b6 pessoas\b|\bsix people\b|\b6 people\b|\bseis pessoas\b/.test(text) ||
    /\bwith five children\b|\bsix individuals\b|\bfamily of six\b|\bfamily of seven\b/.test(text)
  ) return 6;
  if (
    /\b5 pessoas\b|\bfive people\b|\b5 people\b|\bcinco pessoas\b/.test(text) ||
    /\bwith four children\b|\bfive individuals\b|\bfamily of five\b/.test(text)
  ) return 5;
  if (
    /\b4 pessoas\b|\bfour people\b|\b4 people\b|\bquatro pessoas\b/.test(text) ||
    /\bwith three children\b|\bfour individuals\b|\bfamily of four\b/.test(text)
  ) return 4;
  if (
    /\b3 pessoas\b|\bthree people\b|\b3 people\b|\btr[eê]s pessoas\b|\btrio\b/.test(text) ||
    /\bwith two children\b|\bthree individuals\b|\bfamily of three\b/.test(text)
  ) return 3;
  if (
    /\b2 pessoas\b|\btwo people\b|\b2 people\b|\bduas pessoas\b|\bdois pessoas\b/.test(text) ||
    /\bcouple\b|\bcasal\b|\bduet\b/.test(text) ||
    /\bm[aã]e e filho|\bm[aã]e e filha|\bpai e filho|\bpai e filha/.test(text) ||
    /\bm[aã]e e beb[eê]\b|\bmother and baby\b/.test(text) ||
    /\bmarido e mulher\b|\bhusband and wife\b/.test(text) ||
    /\bduo\b/.test(text) ||
    /\btwo (adult )?(women|men)\b/.test(text) ||
    /\ban adult and a child\b/.test(text) ||
    /\bmother and (a |her )?(child|son|daughter|baby)\b/.test(text) ||
    /\bboth subjects\b/.test(text)
  ) return 2;
  if (
    /\b1 pessoa\b|\bone person\b|\b1 person\b|\buma pessoa\b/.test(text) ||
    /\bsolo\b|\bindividual\b|\bportrait of a (woman|man|person|girl|boy)\b/.test(text) ||
    /\ba woman\b|\ba man\b|\ba girl\b|\ba boy\b|\buma mulher\b|\bum homem\b/.test(text) ||
    /\bwoman sitting\b|\bman sitting\b|\bwoman standing\b|\bman standing\b/.test(text) ||
    /\bprofessional woman\b|\bprofessional man\b/.test(text) ||
    /\bthe subject\b/.test(text) ||
    /\bthe woman\b|\bthe man\b|\bthe girl\b|\bthe boy\b/.test(text) ||
    /\bher (hair|eyes|face|hand|gaze)\b|\bhis (hair|eyes|face|hand|gaze)\b/.test(text) ||
    /\bela est[áa]\b|\bele est[áa]\b/.test(text)
  ) return 1;

  return undefined;
}

async function main() {
  console.log('🚀 Aplicando detecção de pessoas...\n');

  const snap = await firestore.collection('prompts').get();
  const prompts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prompt));

  let updated = 0;
  let skipped = 0;

  // Processar em batches de 500 (limite do Firestore)
  const BATCH_SIZE = 500;
  let batch = firestore.batch();
  let batchCount = 0;

  let skippedExisting = 0;

  for (const prompt of prompts) {
    const detected = detectPeopleCount(prompt);

    // Só preenche valores undefined — nunca sobrescreve valor já existente
    if (detected !== undefined && (prompt.peopleCount === undefined || prompt.peopleCount === null)) {
      batch.update(firestore.collection('prompts').doc(prompt.id), {
        peopleCount: detected,
        updatedAt: Date.now(),
      });
      batchCount++;
      updated++;
      console.log(`  ✅ "${prompt.title}" → ${detected} pessoa(s)`);

      if (batchCount === BATCH_SIZE) {
        await batch.commit();
        batch = firestore.batch();
        batchCount = 0;
      }
    } else if (detected !== undefined && detected !== prompt.peopleCount) {
      skippedExisting++;
      console.log(`  ⏭️  "${prompt.title}" (mantido em ${prompt.peopleCount} — detecção sugeriu ${detected})`);
      skipped++;
    } else {
      skipped++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Atualizados: ${updated}`);
  console.log(`⏭️  Sem mudança: ${skipped}`);
  if (skippedExisting > 0) {
    console.log(`   (${skippedExisting} mantidos com valor existente em vez de sobrescrever)`);
  }
  console.log('─────────────────────────────────');
  console.log('🎉 Concluído!');
}

main().catch(console.error);
