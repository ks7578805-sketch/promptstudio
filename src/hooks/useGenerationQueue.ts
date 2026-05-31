import { useState, useEffect, useCallback, useRef } from 'react';
import type { GenerationJob, AnyImageModel, Resolution, Provider } from '../lib/types';
import { migrateJobShape } from '../lib/types';
import { applyIdentityBoost } from '../lib/identityBoost';

const STORAGE_KEY = 'promptstudio-generation-jobs';

interface QueueState {
  jobs: GenerationJob[];
}

function loadJobs(): GenerationJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateJobShape);
  } catch {
    return [];
  }
}

function saveJobs(jobs: GenerationJob[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Erro ao salvar fila:', err);
  }
}

function buildFinalPrompt(job: GenerationJob): string {
  return job.identityBoost ? applyIdentityBoost(job.promptText) : job.promptText;
}

async function callApi(endpoint: string, payload: unknown): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignora erro de parsing
    }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data?.image) throw new Error('Resposta sem campo "image"');
  return data.image as string;
}

async function generateWithGemini(job: GenerationJob): Promise<string[]> {
  const finalPrompt = buildFinalPrompt(job);

  const promises = Array.from({ length: job.count }).map(() =>
    callApi('/api/generate-gemini', {
      model: job.model,
      promptText: finalPrompt,
      referenceImages: job.referenceImages,
    })
  );

  return resolveResults(promises);
}

async function generateWithOpenAI(job: GenerationJob): Promise<string[]> {
  const sizeMap: Record<Resolution, string> = {
    '1K': '1024x1024',
    '2K': '1024x1536',
    '4K': '1024x1536',
  };
  const qualityMap: Record<Resolution, 'low' | 'medium' | 'high'> = {
    '1K': 'medium',
    '2K': 'high',
    '4K': 'high',
  };

  const finalPrompt = buildFinalPrompt(job);

  const promises = Array.from({ length: job.count }).map(() =>
    callApi('/api/generate-openai', {
      model: job.model,
      promptText: finalPrompt,
      referenceImages: job.referenceImages,
      size: sizeMap[job.resolution],
      quality: qualityMap[job.resolution],
    })
  );

  return resolveResults(promises);
}

async function resolveResults(promises: Promise<string>[]): Promise<string[]> {
  const results = await Promise.allSettled(promises);
  const successful = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value);

  if (successful.length === 0) {
    const firstError = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
    throw new Error(firstError?.reason?.message ?? 'Falha ao gerar imagens');
  }
  return successful;
}

async function generateImages(job: GenerationJob): Promise<string[]> {
  if (job.provider === 'google') return generateWithGemini(job);
  if (job.provider === 'openai') return generateWithOpenAI(job);
  throw new Error(`Provedor desconhecido: ${job.provider}`);
}

export function useGenerationQueue() {
  const [state, setState] = useState<QueueState>({ jobs: loadJobs() });
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveJobs(state.jobs);
  }, [state.jobs]);

  useEffect(() => {
    const pending = state.jobs.filter(
      j => j.status === 'pending' && !processingRef.current.has(j.id)
    );

    for (const job of pending) {
      processingRef.current.add(job.id);

      setState(prev => ({
        jobs: prev.jobs.map(j =>
          j.id === job.id ? { ...j, status: 'generating' as const } : j
        ),
      }));

      generateImages(job)
        .then(results => {
          setState(prev => ({
            jobs: prev.jobs.map(j =>
              j.id === job.id
                ? { ...j, status: 'done' as const, results, completedAt: Date.now() }
                : j
            ),
          }));
        })
        .catch(err => {
          console.error('Erro na geração:', err);
          setState(prev => ({
            jobs: prev.jobs.map(j =>
              j.id === job.id
                ? { ...j, status: 'error' as const, error: err.message, completedAt: Date.now() }
                : j
            ),
          }));
        })
        .finally(() => {
          processingRef.current.delete(job.id);
        });
    }
  }, [state.jobs]);

  const addJob = useCallback((params: {
    promptId: string;
    promptTitle: string;
    promptText: string;
    referenceImages: string[];
    provider: Provider;
    model: AnyImageModel;
    resolution: Resolution;
    count: number;
    identityBoost: boolean;
  }) => {
    const job: GenerationJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...params,
      status: 'pending',
      results: [],
      createdAt: Date.now(),
    };
    setState(prev => ({ jobs: [job, ...prev.jobs] }));
    return job.id;
  }, []);

  const removeJob = useCallback((id: string) => {
    setState(prev => ({ jobs: prev.jobs.filter(j => j.id !== id) }));
  }, []);

  const clearDone = useCallback(() => {
    setState(prev => ({ jobs: prev.jobs.filter(j => j.status !== 'done' && j.status !== 'error') }));
  }, []);

  const clearAll = useCallback(() => {
    setState({ jobs: [] });
  }, []);

  return {
    jobs: state.jobs,
    addJob,
    removeJob,
    clearDone,
    clearAll,
    activeCount: state.jobs.filter(j => j.status === 'pending' || j.status === 'generating').length,
    doneCount: state.jobs.filter(j => j.status === 'done').length,
  };
}
