import { useState, useCallback } from 'react';
import type { TextGenerationPipeline } from '@huggingface/transformers';
import type { Message } from '../types';
import { generateWithPseudoStreaming } from '../services/streamingService';

export function useChat(generator: TextGenerationPipeline | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || !generator || isGenerating) return;

    // Add user message
    const newMessages: Message[] = [...messages, { 
      role: 'user', 
      content: userMessage.trim() 
    }];
    setMessages(newMessages);
    setIsGenerating(true);
    setStreamingText('');

    // Small delay for UI update
    await new Promise(resolve => setTimeout(resolve, 0));

    await generateWithPseudoStreaming(
      generator,
      newMessages,
      {
        onToken: (text: string) => {
          setStreamingText(text);
        },
        onComplete: (fullText: string) => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: fullText
          }]);
          setStreamingText('');
          setIsGenerating(false);
        },
        onError: (error: Error) => {
          console.error('Generation error:', error);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Error: ${error.message}`
          }]);
          setStreamingText('');
          setIsGenerating(false);
        }
      },
      30 // Delay in ms between word reveals
    );
  }, [generator, messages, isGenerating]);

  return {
    messages,
    streamingText,
    isGenerating,
    sendMessage
  };
}