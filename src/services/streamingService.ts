import type { TextGenerationPipeline } from '@huggingface/transformers';
import type { Message } from '../types';
import { formatChatPrompt } from '../utils/chatFormatter';

export interface StreamingCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Custom streaming implementation that works around transformers.js limitations
 * by generating text incrementally with lower max_new_tokens
 */
export async function generateWithStreaming(
  generator: TextGenerationPipeline,
  messages: Message[],
  callbacks: StreamingCallbacks
): Promise<void> {
  const prompt = formatChatPrompt(messages);
  let fullResponse = '';
  let previousLength = 0;
  const maxTotalTokens = 128;
  const chunkSize = 10; // Generate 10 tokens at a time for pseudo-streaming
  
  try {
    // Generate in small chunks to simulate streaming
    for (let i = 0; i < maxTotalTokens; i += chunkSize) {
      const result = await generator(prompt + fullResponse, {
        max_new_tokens: Math.min(chunkSize, maxTotalTokens - i),
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      });

      const generated = Array.isArray(result) ? result[0] : result;
      const fullText = (generated as any).generated_text || '';
      
      // Extract just the new assistant response
      const assistantResponse = extractAssistantResponse(fullText);
      
      // Check if we got new text
      if (assistantResponse.length > previousLength) {
        const newText = assistantResponse.slice(previousLength);
        fullResponse = assistantResponse;
        previousLength = assistantResponse.length;
        
        // Call the token callback with new text
        callbacks.onToken(newText);
        
        // Check for end of generation
        if (isResponseComplete(assistantResponse) || 
            assistantResponse.includes('<|im_end|>') ||
            fullText.includes('<|im_end|>')) {
          break;
        }
      } else {
        // No new text generated, we're done
        break;
      }
    }
    
    callbacks.onComplete(fullResponse);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

/**
 * Alternative: Generate all at once but extract incrementally for display
 */
export async function generateWithPseudoStreaming(
  generator: TextGenerationPipeline,
  messages: Message[],
  callbacks: StreamingCallbacks,
  delayMs: number = 30
): Promise<void> {
  const prompt = formatChatPrompt(messages);
  
  try {
    const result = await generator(prompt, {
      max_new_tokens: 512,
      temperature: 0.7,
      do_sample: true,
      top_p: 0.9,
      repetition_penalty: 1.1,
    });

    const generated = Array.isArray(result) ? result[0] : result;
    const fullText = (generated as any).generated_text || '';
    const assistantResponse = extractAssistantResponse(fullText);
    
    // Simulate streaming by revealing text gradually
    let currentText = '';
    const words = assistantResponse.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentText += (i > 0 ? ' ' : '') + word;
      callbacks.onToken(currentText);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    callbacks.onComplete(assistantResponse);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

function extractAssistantResponse(fullText: string): string {
  // Try to extract text after the last assistant marker
  const assistantStart = fullText.lastIndexOf('<|im_start|>assistant\n');
  
  if (assistantStart !== -1) {
    const response = fullText
      .slice(assistantStart + '<|im_start|>assistant\n'.length)
      .split('<|im_end|>')[0]
      .split('<|im_start|>')[0]
      .trim();
    
    if (response) return response;
  }
  
  // Fallback extraction
  const parts = fullText.split('assistant\n');
  if (parts.length > 1) {
    const response = parts[parts.length - 1]
      ?.split('<|')[0]
      ?.split('user')[0]
      ?.trim();
    
    if (response) return response;
  }
  
  return '';
}

function isResponseComplete(text: string): boolean {
  // Check for common ending punctuation
  const lastChar = text.trim().slice(-1);
  return ['.', '!', '?', '"', ')', ']'].includes(lastChar);
}