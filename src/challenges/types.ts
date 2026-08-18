export type Category =
  | 'motion'
  | 'operator'
  | 'text-object'
  | 'visual'
  | 'search'
  | 'replace';

export type Position = {
  line: number;
  column: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  category: Category;
  initialContent: string;
  targetContent: string;
  initialCursor?: Position;
  hints?: string[];
  concepts?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  intendedMove?: string;
};
