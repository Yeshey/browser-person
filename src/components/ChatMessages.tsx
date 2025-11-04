import { useEffect, useRef } from 'react';
import type { Message } from '../types';

interface ChatMessagesProps {
  messages: Message[];
  streamingText: string;
  isGenerating: boolean;
}

export function ChatMessages({ messages, streamingText, isGenerating }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div>
      {messages.map((msg, idx) => (
        <div key={idx} style={{ marginBottom: '30px' }}>
          <div style={{ 
            color: '#888', 
            fontSize: '12px', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {msg.role === 'user' ? 'You' : 'Assistant'}
          </div>
          <div style={{ 
            fontSize: '16px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {msg.content}
          </div>
        </div>
      ))}
      
      {/* Streaming text with cursor */}
      {streamingText && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            color: '#888', 
            fontSize: '12px', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Assistant
          </div>
          <div style={{ 
            fontSize: '16px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {streamingText}
            <span style={{ 
              display: 'inline-block',
              width: '2px',
              height: '18px',
              backgroundColor: '#fff',
              marginLeft: '2px',
              animation: 'blink 1s infinite'
            }}>|</span>
          </div>
        </div>
      )}
      
      {/* Thinking indicator (before streaming starts) */}
      {isGenerating && !streamingText && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            color: '#888', 
            fontSize: '12px', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Assistant
          </div>
          <div style={{ 
            fontSize: '16px',
            color: '#666'
          }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
            <span style={{ animation: 'pulse 1.5s ease-in-out 0.2s infinite' }}>●</span>
            <span style={{ animation: 'pulse 1.5s ease-in-out 0.4s infinite' }}>●</span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}