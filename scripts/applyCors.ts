/**
 * Aplica a configuração de CORS (cors.json) no bucket do Firebase Storage.
 *
 * Por que existe: o upload de imagem no canvas (Spaces) falha silenciosamente
 * por CORS do bucket. Em vez de exigir gsutil/gcloud instalados, este script
 * usa @google-cloud/storage com a service account já usada pelos outros scripts.
 *
 * Pré-requisito: scripts/serviceAccount.json
 *   (Firebase Console → Configurações do projeto → Contas de serviço →
 *    Gerar nova chave privada)
 *
 * Uso: npm run apply-cors
 */
import { readFileSync } from 'fs';
import { Storage } from '@google-cloud/storage';

const bucketName = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'promptstudio-91999.firebasestorage.app';
const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccount.json', 'utf-8'));
const cors = JSON.parse(readFileSync('./cors.json', 'utf-8'));

async function main() {
  const storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
  });

  const bucket = storage.bucket(bucketName);
  console.log(`Aplicando CORS em gs://${bucketName} ...`);
  await bucket.setCorsConfiguration(cors);

  const [metadata] = await bucket.getMetadata();
  console.log('✅ CORS aplicado. Configuração atual:');
  console.log(JSON.stringify(metadata.cors, null, 2));
}

main().catch((err) => {
  console.error('❌ Falha ao aplicar CORS:', err.message);
  process.exit(1);
});
