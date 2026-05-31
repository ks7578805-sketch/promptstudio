import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import * as dotenv from 'dotenv';
import serviceAccount from './serviceAccount.json';

dotenv.config();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const databaseURL = process.env.VITE_FIREBASE_DATABASE_URL;

if (!projectId || !databaseURL) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID ou VITE_FIREBASE_DATABASE_URL não definidos no .env');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
    databaseURL,
  });
}

const firestore = getFirestore();

interface Section {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

interface Prompt {
  id: string;
  title: string;
  prompt: string;
  negative?: string;
  model: string;
  ratio: string;
  image?: string;
  sectionId: string;
  tags: string[];
  peopleCount?: number;
  copies: number;
  updatedAt: number;
  createdAt: number;
}

const BATCH_SIZE = 450; // limite Firestore = 500, deixo margem

async function fetchRealtimeDB(): Promise<{ sections: Section[]; prompts: Prompt[] }> {
  console.log('📥 Buscando dados do Realtime Database (via Admin SDK)...');
  const snap = await getDatabase().ref('/db').once('value');
  const data = snap.val() ?? {};
  return {
    sections: Array.isArray(data?.sections) ? data.sections.filter(Boolean) : [],
    prompts: Array.isArray(data?.prompts) ? data.prompts.filter(Boolean) : [],
  };
}

async function commitInBatches<T extends { id: string }>(
  collectionName: string,
  items: T[],
  transform: (item: T, index: number) => Record<string, unknown>,
) {
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();
    chunk.forEach((item, j) => {
      const ref = firestore.collection(collectionName).doc(item.id);
      batch.set(ref, transform(item, i + j));
    });
    await batch.commit();
    console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches} (${chunk.length} docs)`);
  }
}

async function migrateToFirestore(sections: Section[], prompts: Prompt[]) {
  console.log(`\n📦 Migrando ${sections.length} seções e ${prompts.length} prompts via batched writes...\n`);

  console.log('📂 Seções:');
  await commitInBatches('sections', sections, (section, i) => {
    const { id, ...data } = section;
    void id;
    return { ...data, order: data.order ?? i };
  });

  console.log('\n📝 Prompts:');
  await commitInBatches('prompts', prompts, (prompt) => {
    const { id, ...data } = prompt;
    void id;
    return {
      ...data,
      copies: data.copies ?? 0,
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: data.updatedAt ?? Date.now(),
    };
  });

  console.log('\n🎉 Migração concluída com sucesso!');
  console.log(`   ${sections.length} seções migradas`);
  console.log(`   ${prompts.length} prompts migrados`);
}

async function main() {
  const startedAt = Date.now();
  try {
    const { sections, prompts } = await fetchRealtimeDB();

    if (sections.length === 0 && prompts.length === 0) {
      console.log('⚠️  Nenhum dado encontrado no Realtime Database.');
      process.exit(0);
    }

    await migrateToFirestore(sections, prompts);
    console.log(`\n⏱  Tempo total: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  }
}

main();
