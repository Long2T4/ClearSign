import { useState, useRef, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const chatStyles = `
  @keyframes chatSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes chatPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.08); }
  }
  @keyframes typingDot {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30%            { transform: translateY(-5px); opacity: 1; }
  }
  @keyframes chipFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .chat-window { animation: chatSlideUp 0.25s ease both; }
  .chat-toggle-btn { animation: chatPulse 2.5s ease-in-out infinite; }
  .chat-toggle-btn:hover { animation: none; transform: scale(1.1) !important; }

  .chat-msg-user {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.55;
    max-width: 78%;
    align-self: flex-end;
    word-break: break-word;
  }
  .chat-msg-bot {
    background: #f1f5f9;
    color: #1e293b;
    border-radius: 18px 18px 18px 4px;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.55;
    max-width: 78%;
    align-self: flex-start;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .quick-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    padding: 7px 13px;
    font-size: 12.5px;
    font-weight: 700;
    color: #2563eb;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.18s ease;
    animation: chipFadeIn 0.3s ease both;
    white-space: nowrap;
  }
  .quick-chip:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(37,99,235,0.12);
  }

  .chat-input {
    flex: 1;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'Nunito', sans-serif;
    outline: none;
    color: #0f172a;
    background: white;
    transition: border-color 0.2s;
    resize: none;
    max-height: 100px;
    min-height: 42px;
    line-height: 1.4;
  }
  .chat-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  .chat-send-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .chat-send-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(37,99,235,0.4);
  }
  .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .typing-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #94a3b8; display: inline-block;
  }
  .typing-dot:nth-child(1) { animation: typingDot 1.2s 0.0s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation: typingDot 1.2s 0.2s ease-in-out infinite; }
  .typing-dot:nth-child(3) { animation: typingDot 1.2s 0.4s ease-in-out infinite; }

  .category-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.18s ease;
    text-align: left;
  }
  .category-btn:hover {
    border-color: #93c5fd;
    background: #eff6ff;
    transform: translateX(3px);
  }
`

const SYSTEM_PROMPT = `You are ClearSign's helpful AI assistant. ClearSign is a free tool that helps people understand confusing documents — hospital bills, lease agreements, contracts, terms of service, and utility bills — before they sign or pay.

Your role is to:
- Answer questions about legal and financial documents in plain, friendly language
- Explain common clauses, terms, and red flags found in documents
- Help users understand their rights as tenants, patients, and consumers
- Give general guidance (remind users to consult a professional for specific legal advice)
- Help users navigate the ClearSign app

Be concise, warm, and empowering. Use short paragraphs. Avoid legal jargon. Speak like a knowledgeable friend, not a lawyer. Keep answers under 120 words unless the question truly needs more detail.`

// Topic categories with their quick questions
const CATEGORIES = [
  {
    id: 'lease',
    icon: '🏠',
    label: 'Lease & Renting',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    questions: [
      { icon: '⚠️', text: "What are common red flags in a lease?" },
      { icon: '🔑', text: "Can my landlord enter without notice?" },
      { icon: '💰', text: "What can my landlord deduct from my deposit?" },
      { icon: '📋', text: "What is an automatic renewal clause?" },
    ]
  },
  {
    id: 'hospital',
    icon: '🏥',
    label: 'Hospital Bills',
    color: '#dc2626',
    bg: '#fff5f5',
    border: '#fca5a5',
    questions: [
      { icon: '🔍', text: "How do I spot overcharges on my bill?" },
      { icon: '📞', text: "Can I negotiate my hospital bill?" },
      { icon: '📄', text: "What is an itemized bill and how do I get one?" },
      { icon: '🚫', text: "What charges are illegal on a hospital bill?" },
    ]
  },
  {
    id: 'contracts',
    icon: '📋',
    label: 'Contracts & NDAs',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    questions: [
      { icon: '⚡', text: "What is forced arbitration and is it bad?" },
      { icon: '🔒', text: "How broad can an NDA legally be?" },
      { icon: '🚪', text: "What makes a non-compete unenforceable?" },
      { icon: '⚖️', text: "What is a one-sided termination clause?" },
    ]
  },
  {
    id: 'tos',
    icon: '📱',
    label: 'Terms of Service',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#86efac',
    questions: [
      { icon: '📊', text: "Can apps really sell my data to third parties?" },
      { icon: '🔄', text: "How do I spot auto-renewal traps?" },
      { icon: '⚠️', text: "What rights am I waiving by clicking 'Agree'?" },
      { icon: '🗑️', text: "Can they delete my account without warning?" },
    ]
  },
]

// Follow-up chips shown after the bot responds
const FOLLOWUPS = [
  { icon: '➕', text: "Tell me more" },
  { icon: '🤔', text: "Give me an example" },
  { icon: '🛡️', text: "What are my rights here?" },
  { icon: '📞', text: "Who should I contact?" },
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  // view: 'home' | 'chat'
  const [view, setView] = useState('home')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(false)
  const [showFollowups, setShowFollowups] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUnread(false)
      if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, view])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    setView('chat')
    setShowFollowups(false)
    const userMsg = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: updatedMessages,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      setMessages(prev => [...prev, { role: 'assistant', content: data.content[0].text }])
      setShowFollowups(true)
      if (!open) setUnread(true)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const goHome = () => {
    setView('home')
    setMessages([])
    setShowFollowups(false)
    setInput('')
  }

  return (
    <>
      <style>{chatStyles}</style>

      {open && (
        <div
          className="chat-window"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '370px',
            maxWidth: 'calc(100vw - 48px)',
            height: view === 'home' ? 'auto' : '520px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'white',
            borderRadius: '22px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            fontFamily: 'Nunito, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {view === 'chat' && (
                <button
                  onClick={goHome}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Back to menu"
                >←</button>
              )}
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                🔍
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: '15px', lineHeight: 1.2 }}>ClearSign AI</p>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: 600 }}>
                  {view === 'home' ? 'Pick a topic or ask anything' : 'Your document assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', color: 'white', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >✕</button>
          </div>

          {/* HOME VIEW */}
          {view === 'home' && (
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                Browse by topic
              </p>
              {CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <p style={{ fontSize: '11.5px', fontWeight: 800, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{cat.icon}</span> {cat.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {cat.questions.map((q, i) => (
                      <button
                        key={i}
                        className="category-btn"
                        style={{ borderColor: cat.border }}
                        onMouseOver={e => { e.currentTarget.style.background = cat.bg; e.currentTarget.style.borderColor = cat.border; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        onClick={() => sendMessage(q.text)}
                      >
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{q.icon}</span>
                        <span style={{ fontSize: '13px', color: '#334155' }}>{q.text}</span>
                        <span style={{ marginLeft: 'auto', color: '#cbd5e1', fontSize: '14px' }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>OR ASK ANYTHING</span>
                <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
              </div>

              {/* Free input on home */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'chat' && (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e2e8f0 transparent',
              }}>
                {messages.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
                    {msg.content}
                  </div>
                ))}

                {loading && (
                  <div className="chat-msg-bot" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 14px' }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                )}

                {/* Follow-up chips */}
                {showFollowups && !loading && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {FOLLOWUPS.map((chip, i) => (
                      <button
                        key={i}
                        className="quick-chip"
                        style={{ animationDelay: `${i * 0.06}s` }}
                        onClick={() => sendMessage(chip.text)}
                      >
                        <span>{chip.icon}</span> {chip.text}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                background: 'white',
                flexShrink: 0,
              }}>
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up..."
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={open ? '' : 'chat-toggle-btn'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: open ? '#64748b' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 1000,
          transition: 'all 0.2s ease',
        }}
        title={open ? 'Close chat' : 'Ask ClearSign AI'}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <span style={{ lineHeight: 1 }}>💬</span>
        )}
        {unread && !open && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '14px', height: '14px',
            background: '#f43f5e', borderRadius: '50%', border: '2px solid white',
          }} />
        )}
      </button>
    </>
  )
}