import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Data URL inválida');
  return { buffer: Buffer.from(match[2], 'base64'), mime: match[1] };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  try {
    const { model, promptText, referenceImages, size, quality } = req.body as {
      model?: string;
      promptText?: string;
      referenceImages?: string[];
      size?: string;
      quality?: 'low' | 'medium' | 'high';
    };

    if (!model || !promptText) {
      return res.status(400).json({ error: 'Payload inválido: model e promptText são obrigatórios' });
    }
    if (!size || !quality) {
      return res.status(400).json({ error: 'Payload inválido: size e quality são obrigatórios' });
    }

    const hasReferenceImages = Array.isArray(referenceImages) && referenceImages.length > 0;

    let apiRes: Response;
    if (hasReferenceImages) {
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', promptText);
      form.append('size', size);
      form.append('quality', quality);
      form.append('n', '1');
      referenceImages.forEach((img, idx) => {
        const { buffer, mime } = dataUrlToBuffer(img);
        form.append('image[]', new Blob([new Uint8Array(buffer)], { type: mime }), `reference_${idx}.jpg`);
      });
      apiRes = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: form,
      });
    } else {
      apiRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, prompt: promptText, size, quality, n: 1, output_format: 'b64_json' }),
      });
    }

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any;
      try { parsed = JSON.parse(errBody); } catch { parsed = { error: { message: errBody } }; }
      const msg = parsed?.error?.message ?? `Erro ${apiRes.status} na OpenAI`;
      if (msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('verification')) {
        return res.status(403).json({
          error: 'Organização OpenAI não verificada. Acesse Settings → Organization → Verification no platform.openai.com',
        });
      }
      return res.status(apiRes.status).json({ error: msg });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await apiRes.json() as any;
    const item = data?.data?.[0];
    if (!item) return res.status(502).json({ error: 'OpenAI não retornou imagem' });

    if (item.b64_json) {
      return res.status(200).json({ image: `data:image/png;base64,${item.b64_json}` });
    }
    if (item.url) {
      const imgRes = await fetch(item.url);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const mime = imgRes.headers.get('content-type') ?? 'image/png';
      return res.status(200).json({ image: `data:${mime};base64,${buf.toString('base64')}` });
    }
    return res.status(502).json({ error: 'Formato de resposta inesperado' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido na geração OpenAI';
    console.error('OpenAI error:', msg);
    return res.status(500).json({ error: msg });
  }
}

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
