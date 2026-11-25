import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Loader2 
} from 'lucide-react';
import { ChatMessage, HealthStatus } from '../types';
import { sendChatMessage } from '../api/chat';
import { SourceList } from './SourceList';

interface ChatPanelProps {
  health: HealthStatus | null;
  hasDocuments: boolean;
  onSelectSource?: (id: string) => void;
  onError: (msg: string) => void;
}

const SUGGESTED_PROMPTS = [
  "What is the vacation and sick leave policy?",
  "Summarize key responsibilities and remote guidelines.",
  "What security or compliance policies are mentioned?",
  "Are there specific health or employee benefits listed?",
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  health,
  hasDocuments,
  onSelectSource,
  onError,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isSending) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const response = await sendChatMessage(q);

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        sources: response.sources,
        mode: response.mode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorText = err.detail || 'An error occurred while answering your question.';
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error: ${errorText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      onError(errorText);
    } finally {
      setIsSending(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMock = health?.provider === 'mock';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '620px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Knowledge Assistant
              </h2>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                background: isMock ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.2)',
                color: isMock ? '#fbbf24' : '#a5b4fc',
              }}>
                {isMock ? 'Mock Engine' : 'Groq LLM'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Context-grounded answers with verified document citations
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            title="Clear chat history"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fb7185';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Trash2 size={13} />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            margin: 'auto',
            maxWidth: '480px',
            padding: '2rem 1rem',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              marginBottom: '1rem',
            }}>
              <Sparkles size={28} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Ask anything about your documents
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.5 }}>
              The assistant scans extracted text using keyword overlap and answers with source references.
            </p>

            {/* Suggested prompts */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: '100%',
              marginTop: '1.5rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>
                Try asking:
              </div>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isAssistant = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: isUser ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isUser ? '#ffffff' : '#818cf8',
                  flexShrink: 0,
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                }}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: isUser ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : msg.isError ? 'rgba(244, 63, 94, 0.1)' : 'rgba(30, 41, 59, 0.7)',
                    border: `1px solid ${isUser ? 'transparent' : msg.isError ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}`,
                    color: msg.isError ? '#fb7185' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    position: 'relative',
                  }}>
                    {msg.text}

                    {/* Sources section if present */}
                    {isAssistant && msg.sources && (
                      <SourceList
                        sources={msg.sources}
                        onSelectSource={onSelectSource}
                      />
                    )}

                    {/* Copy action for assistant responses */}
                    {isAssistant && !msg.isError && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '0.5rem',
                      }}>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy response"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.72rem',
                            color: copiedId === msg.id ? '#34d399' : 'var(--text-muted)',
                            background: 'transparent',
                          }}
                        >
                          {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp & mode indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    marginTop: '0.3rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                  }}>
                    <span>{msg.timestamp}</span>
                    {msg.mode && (
                      <>
                        <span>•</span>
                        <span style={{ color: msg.mode === 'mock' ? '#fbbf24' : '#818cf8', fontWeight: 600 }}>
                          {msg.mode === 'mock' ? 'Mock engine' : 'LLM engine'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading typing indicator */}
        {isSending && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              border: '1px solid var(--border-subtle)',
            }}>
              <Bot size={16} />
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '4px 16px 16px 16px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing uploaded documents & generating grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.6)',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.65rem',
          background: 'rgba(9, 13, 22, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.65rem 0.85rem',
          transition: 'border-color 0.2s',
        }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasDocuments
                ? "Ask a question about the uploaded documents... (Press Enter to send)"
                : "Upload at least one document on the left, then ask questions..."
            }
            disabled={isSending}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              resize: 'none',
              fontFamily: 'inherit',
              maxHeight: '120px',
              lineHeight: 1.5,
            }}
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || isSending}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: inputQuestion.trim() && !isSending ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
              color: inputQuestion.trim() && !isSending ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputQuestion.trim() && !isSending ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              boxShadow: inputQuestion.trim() && !isSending ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isSending ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
        }}>
          <span>Press <strong style={{ color: 'var(--text-secondary)' }}>Enter</strong> to send • <strong style={{ color: 'var(--text-secondary)' }}>Shift+Enter</strong> for newline</span>
          <span>Keyword overlap retrieval</span>
        </div>
      </div>
    </div>
  );
};
