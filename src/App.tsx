import { useState, useEffect, useRef } from 'react';
import { useModelLoader } from './hooks/useModelLoader';
import { LoadingScreen } from './components/LoadingScreen';
import { formatChatPrompt, extractAssistantResponse } from './utils/chatFormatter';
import { Message } from './types';
import './App.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { generator, status, progress } = useModelLoader();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async () => {
    if (!input.trim() || !generator || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    
    // Immediately add user message and show assistant is thinking
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsGenerating(true);
    setStreamingText('');

    // Let the UI update before starting generation
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const prompt = formatChatPrompt(newMessages);

      // Generate response
      const result = await generator(prompt, {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      });

      const generated = Array.isArray(result) ? result[0] : result;
      const fullText = (generated as any).generated_text || '';
      const assistantResponse = extractAssistantResponse(fullText);

      // Show streaming effect
      let currentText = '';
      const chars = assistantResponse.split('');
      
      for (let i = 0; i < chars.length; i++) {
        currentText += chars[i];
        setStreamingText(currentText);
        
        // Adjust delay: shorter for spaces, slightly longer for other chars
        const delay = chars[i] === ' ' ? 10 : 20;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Add final message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantResponse 
      }]);
      setStreamingText('');
    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = `Error: ${error}`;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg 
      }]);
      setStreamingText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === 'loading') {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main content */}
      <div style={{
        flex: 1,
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 20px',
        lineHeight: '1.6'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'normal', 
          marginBottom: '40px',
          color: '#fff'
        }}>
          Browser AI
        </h1>

        {/* Conversation */}
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
      </div>

      {/* Input area */}
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
            onClick={sendMessage}
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

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;