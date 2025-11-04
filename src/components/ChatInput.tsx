import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isGenerating: boolean;
}

export function ChatInput({ onSend, isGenerating }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid #333',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: '14px',
            fontSize: '16px',
            border: '1px solid #333',
            borderRadius: '4px',
            outline: 'none',
            backgroundColor: '#2a2a2a',
            color: '#fff'
          }}
        />
        <button 
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            cursor: isGenerating || !input.trim() ? 'not-allowed' : 'pointer',
            backgroundColor: isGenerating || !input.trim() ? '#333' : '#fff',
            color: isGenerating || !input.trim() ? '#666' : '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '500'
          }}
        >
          {isGenerating ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}