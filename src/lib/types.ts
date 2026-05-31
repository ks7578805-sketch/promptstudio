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
