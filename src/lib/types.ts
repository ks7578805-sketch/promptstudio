export interface Section {
  id: string;
  name: string;
  icon: string;
  color: 'red' | 'gray' | 'blue' | 'green' | 'pink';
  order: number;
}

export interface Prompt {
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

export type SortOption = 'recent' | 'copies' | 'az';
export type PeopleFilter = 'all' | '1' | '2' | '3' | '4' | '5' | '6';
export type ColorOption = Section['color'];

export type GeminiModel = 'gemini-2.5-flash-image' | 'gemini-3.1-flash-image' | 'gemini-3-pro-image';
export type OpenAIModel = 'gpt-image-1-mini' | 'gpt-image-1.5' | 'gpt-image-2';
export type AnyImageModel = GeminiModel | OpenAIModel;
export type Provider = 'google' | 'openai';

export type Resolution = '1K' | '2K' | '4K';
export type GenerationStatus = 'pending' | 'generating' | 'done' | 'error';

export interface GenerationJob {
  id: string;
  promptId: string;
  promptTitle: string;
  promptText: string;
  referenceImages: string[];
  identityBoost: boolean;
  provider: Provider;
  model: AnyImageModel;
  resolution: Resolution;
  count: number;
  status: GenerationStatus;
  results: string[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export const MODEL_LABELS: Record<AnyImageModel, string> = {
  'gemini-2.5-flash-image': 'Nano Banana',
  'gemini-3.1-flash-image': 'Nano Banana 2',
  'gemini-3-pro-image': 'Nano Banana Pro',
  'gpt-image-1-mini': 'GPT Image Mini',
  'gpt-image-1.5': 'GPT Image 1.5',
  'gpt-image-2': 'GPT Image 2',
};

export const PROVIDER_INFO: Record<Provider, { name: string; icon: string; description: string }> = {
  google: {
    name: 'Google',
    icon: '🍌',
    description: 'Nano Banana — preserva muito bem rosto e identidade',
  },
  openai: {
    name: 'OpenAI',
    icon: '✦',
    description: 'GPT Image — fotorrealismo de ponta e texto perfeito em imagem',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateJobShape(job: any): GenerationJob {
  if (job.referenceImages && Array.isArray(job.referenceImages)) {
    return {
      ...job,
      identityBoost: job.identityBoost ?? false,
    };
  }
  return {
    ...job,
    referenceImages: job.referenceImage ? [job.referenceImage] : [],
    identityBoost: false,
  };
}
