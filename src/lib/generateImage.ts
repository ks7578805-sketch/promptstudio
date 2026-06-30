import type { Provider, AnyImageModel } from './types';

// OpenAI gpt-image aceita poucos tamanhos — mapeia cada proporção para o
// mais próximo por orientação (quadrado / paisagem / retrato).
const SIZE_MAP: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '2:3': '1024x1792',
  '3:4': '1024x1792',
  '1:2': '1024x1792',
  '2:1': '1792x1024',
  '4:5': '1024x1280',
  '3:2': '1792x1024',
  '4:3': '1792x1024',
};

async function callApi(endpoint: string, payload: unknown): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try { const b = await res.json(); if (b?.error) msg = b.error; } catch { /* */ }
    throw new Error(msg);
  }
  const data = await res.json();
  if (!data?.image) throw new Error('Resposta sem campo "image"');
  return data.image as string;
}

export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateImagesForSpace(opts: {
  provider: Provider;
  model: AnyImageModel;
  promptText: string;
  referenceImages?: string[];
  ratio: string;
  count: number;
}): Promise<string[]> {
  const { provider, model, promptText, referenceImages = [], ratio, count } = opts;
  const size = SIZE_MAP[ratio] ?? '1024x1024';

  const refDataUrls = referenceImages.length > 0
    ? await Promise.all(referenceImages.map(urlToDataUrl))
    : [];

  const endpoint = provider === 'google' ? '/api/generate-gemini' : '/api/generate-openai';
  const payload = provider === 'google'
    ? { model, promptText, referenceImages: refDataUrls }
    : { model, promptText, referenceImages: refDataUrls, size, quality: 'medium' };

  const promises = Array.from({ length: count }, () => callApi(endpoint, payload));
  const results = await Promise.allSettled(promises);
  const successful = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successful.length === 0) {
    const first = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
    throw new Error(first?.reason?.message ?? 'Falha ao gerar imagens');
  }
  return successful;
}

// Gera UMA imagem (FASE A — cada quadro preenche de forma independente conforme
// fica pronto). Recebe as imagens de referência JÁ convertidas para data URL
// (a conversão acontece uma vez no nó), preservando a lógica de referência atual.
export async function generateOneImageForSpace(opts: {
  provider: Provider;
  model: AnyImageModel;
  promptText: string;
  referenceDataUrls?: string[];
  ratio: string;
}): Promise<string> {
  const { provider, model, promptText, referenceDataUrls = [], ratio } = opts;
  const size = SIZE_MAP[ratio] ?? '1024x1024';

  const endpoint = provider === 'google' ? '/api/generate-gemini' : '/api/generate-openai';
  const payload = provider === 'google'
    ? { model, promptText, referenceImages: referenceDataUrls }
    : { model, promptText, referenceImages: referenceDataUrls, size, quality: 'medium' };

  return callApi(endpoint, payload);
}
