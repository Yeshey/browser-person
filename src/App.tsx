import { useModelLoader } from './hooks/useModelLoader';
import { useChat } from './hooks/useChat';
import { LoadingScreen } from './components/LoadingScreen';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import './App.css';

function App() {
  const { generator, status, progress } = useModelLoader();
  const { messages, streamingText, isGenerating, sendMessage } = useChat(generator);

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

        <ChatMessages 
          messages={messages}
          streamingText={streamingText}
          isGenerating={isGenerating}
        />
      </div>

      <ChatInput 
        onSend={sendMessage}
        isGenerating={isGenerating}
      />

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