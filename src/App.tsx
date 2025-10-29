import { useState, useEffect, useRef } from 'react';
import { pipeline, TextGenerationPipeline } from '@huggingface/transformers';
import './App.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState('Initializing...');
  const generatorRef = useRef<TextGenerationPipeline | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoadProgress('Downloading model... (this may take 1-2 minutes)');
        
        // Using Qwen2.5 - better for chat/instruction following
        const generator = await pipeline(
          'text-generation',
          'onnx-community/Qwen2.5-0.5B-Instruct',
          { 
            dtype: 'q4',
            device: 'wasm',
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                const percent = Math.round((progress.progress || 0) * 100);
                setLoadProgress(`Loading: ${percent}%`);
              } else if (progress.status === 'done') {
                setLoadProgress(`Loading model files...`);
              }
            }
          }
        );

        generatorRef.current = generator;
        setLoadProgress('Model loaded! Ready to chat.');
        setTimeout(() => setModelLoading(false), 500);
      } catch (error) {
        console.error('Model loading error:', error);
        setLoadProgress(`Error loading model: ${error}`);
      }
    };

    loadModel();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async () => {
    if (!input.trim() || !generatorRef.current || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);
    setStreamingText('');

    try {
      // Build proper chat format for Qwen2.5
      const conversation = newMessages.map(m => 
        `<|im_start|>${m.role}\n${m.content}<|im_end|>`
      ).join('\n');
      
      const prompt = `${conversation}\n<|im_start|>assistant\n`;

      // Generate with streaming simulation
      const result = await generatorRef.current(prompt, {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        repetition_penalty: 1.1,
      });

      const generated = Array.isArray(result) ? result[0] : result;
      let fullText = (generated as any).generated_text || '';
      
      // Extract only the assistant's response
      let assistantResponse = fullText
        .split('<|im_start|>assistant')[1]
        ?.split('<|im_end|>')[0]
        ?.split('<|im_start|>')[0]
        ?.trim() || '';

      // If extraction failed, try simpler approach
      if (!assistantResponse || assistantResponse.length < 2) {
        const parts = fullText.split('assistant\n');
        assistantResponse = parts[parts.length - 1]
          ?.split('<|')[0]
          ?.split('user')[0]
          ?.trim() || 'I apologize, I could not generate a response.';
      }

      // Simulate streaming effect
      let currentText = '';
      const words = assistantResponse.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingText(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Add final message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantResponse 
      }]);
      setStreamingText('');
    } catch (error) {
      console.error('Generation error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error}` 
      }]);
      setStreamingText('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (modelLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff'
      }}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #333',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ marginBottom: '10px', fontWeight: 'normal' }}>Loading AI Model...</h2>
          <p style={{ color: '#888', fontSize: '14px' }}>{loadProgress}</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
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
          
          {/* Streaming text */}
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
                  width: '8px',
                  height: '16px',
                  backgroundColor: '#fff',
                  marginLeft: '2px',
                  animation: 'blink 1s infinite'
                }}>|</span>
              </div>
            </div>
          )}
          
          {loading && !streamingText && (
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
                color: '#666',
                fontStyle: 'italic'
              }}>
                thinking...
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
            disabled={loading}
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
            disabled={loading || !input.trim()}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: loading || !input.trim() ? '#333' : '#fff',
              color: loading || !input.trim() ? '#666' : '#000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;