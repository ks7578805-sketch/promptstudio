import type { Node, Edge } from '@xyflow/react';
import type { Provider, AnyImageModel } from './types';

export type Ratio = '1:1' | '16:9' | '9:16' | '2:3' | '3:4' | '1:2' | '2:1' | '4:5' | '3:2' | '4:3';

export interface ImageNodeData extends Record<string, unknown> {
  type: 'image';
  url: string;
  label?: string;
  spaceId: string;
  /* Estado do quadro durante a geração (FASE A — criação imediata dos quadros).
     'generating' → quadro vazio mostrando o efeito de pixels até a imagem chegar.
     'done'/ausente → imagem pronta (comportamento normal). 'error' → falhou. */
  status?: 'generating' | 'done' | 'error';
  /* Proporção do quadro enquanto ainda está vazio (placeholder no formato certo). */
  ratio?: Ratio;
}

export interface TextNodeData extends Record<string, unknown> {
  type: 'text';
  content: string;
}

export interface GeneratorNodeData extends Record<string, unknown> {
  type: 'generator';
  prompt: string;
  provider: Provider;
  model: AnyImageModel;
  ratio: Ratio;
  count: number;
  spaceId: string;
}

export type SpaceNodeData = ImageNodeData | TextNodeData | GeneratorNodeData;

export type SpaceNode = Node<SpaceNodeData, 'image' | 'text' | 'generator'>;
export type SpaceEdge = Edge;

export interface Space {
  id: string;
  name: string;
  userId: string;
  nodes: SpaceNode[];
  edges: SpaceEdge[];
  thumbnail: string | null;
  createdAt: number;
  updatedAt: number;
}
