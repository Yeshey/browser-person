import type { Message } from '../types';

export function formatChatPrompt(messages: Message[]): string {
  const conversation = messages.map(m => 
    `<|im_start|>${m.role}\n${m.content}<|im_end|>`
  ).join('\n');
  
  return `${conversation}\n<|im_start|>assistant\n`;
}

export function extractAssistantResponse(fullText: string): string {
  // Try to extract text after the last assistant marker
  let response = fullText
    .split('<|im_start|>assistant')[1]
    ?.split('<|im_end|>')[0]
    ?.split('<|im_start|>')[0]
    ?.trim() || '';

  // Fallback extraction if the above fails
  if (!response || response.length < 2) {
    const parts = fullText.split('assistant\n');
    response = parts[parts.length - 1]
      ?.split('<|')[0]
      ?.split('user')[0]
      ?.trim() || 'I apologize, I could not generate a response.';
  }

  return response;
}