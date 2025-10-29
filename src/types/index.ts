export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type ModelStatus = 'loading' | 'ready' | 'error';