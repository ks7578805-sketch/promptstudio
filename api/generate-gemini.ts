import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function dataUrlToImagePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Data URL inválida');
  return {
    inlineData: { mimeType: match[1], data: match[2] },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor' });
  }

  try {
    const { model, promptText, referenceImages } = req.body as {
      model?: string;
      promptText?: string;
      referenceImages?: string[];
    };

    if (!model || !promptText || !Array.isArray(referenceImages) || referenceImages.length === 0) {
      return res.status(400).json({ error: 'Payload inválido: model, promptText e referenceImages são obrigatórios' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const imageParts = referenceImages.map(dataUrlToImagePart);

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: promptText }, ...imageParts],
      }],
      config: { responseModalities: ['Image'] },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inlineData = (part as any).inlineData;
      if (inlineData) {
        return res.status(200).json({
          image: `data:${inlineData.mimeType};base64,${inlineData.data}`,
        });
      }
    }
    return res.status(502).json({ error: 'Gemini não retornou imagem' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido na geração Gemini';
    console.error('Gemini error:', msg);
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
