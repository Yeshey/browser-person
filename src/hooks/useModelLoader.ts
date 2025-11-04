import { useState, useEffect, useRef } from 'react';
import { pipeline, TextGenerationPipeline } from '@huggingface/transformers';
import type { ModelStatus } from '../types';

export function useModelLoader() {
  const [status, setStatus] = useState<ModelStatus>('loading');
  const [progress, setProgress] = useState('Initializing...');
  const generatorRef = useRef<TextGenerationPipeline | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setProgress('Downloading model... (this may take 1-2 minutes)');
        
        const generator = await pipeline(
            'text-generation',
            'HuggingFaceTB/SmolLM-135M-Instruct', // Only ~135MB!
            { 
              dtype: 'q8', // or even q4
              device: 'wasm',
            progress_callback: (progressData: any) => {
              if (progressData.status === 'progress') {
                const percent = Math.round((progressData.progress || 0) * 100);
                setProgress(`Loading: ${percent}%`);
              } else if (progressData.status === 'done') {
                setProgress(`Loading model files...`);
              }
            }
          }
        );

        generatorRef.current = generator;
        setProgress('Model loaded! Ready to chat.');
        
        // Small delay to show the success message
        setTimeout(() => setStatus('ready'), 500);
      } catch (error) {
        console.error('Model loading error:', error);
        setProgress(`Error loading model: ${error}`);
        setStatus('error');
      }
    };

    loadModel();
  }, []);

  return {
    generator: generatorRef.current,
    status,
    progress
  };
}