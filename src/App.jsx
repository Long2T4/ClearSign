import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from './lib/supabase'
import AuthPage from './components/AuthPage'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Lora:wght@600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Nunito', sans-serif; background: #f8fafc; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  .fade-up   { animation: fadeUp 0.5s 0.00s ease both; }
  .fade-up-1 { animation: fadeUp 0.5s 0.05s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.10s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.15s ease both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.20s ease both; }
  .fade-up-5 { animation: fadeUp 0.5s 0.25s ease both; }
  .float     { animation: float 3s ease-in-out infinite; }
  .spin      { animation: spin 1s linear infinite; }

  .hero-bg {
    background: linear-gradient(135deg, #eef6ff 0%, #f0f7ff 40%, #e8f4ff 70%, #f5f0ff 100%);
  }

  .btn-main {
    width: 100%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(37,99,235,0.3);
  }
  .btn-main:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(37,99,235,0.4); }
  .btn-main:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-dispute {
    width: 100%;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(245,158,11,0.3);
  }
  .btn-dispute:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(245,158,11,0.4); }
  .btn-dispute:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-reset {
    width: 100%;
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    transition: all 0.2s ease;
  }
  .btn-reset:hover { background: #f8fafc; border-color: #cbd5e1; }

  .btn-copy {
    font-size: 13px;
    border-radius: 8px;
    padding: 6px 14px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    transition: all 0.2s ease;
  }
  .btn-copy.copied {
    background: #f0fdf4;
    color: #15803d;
    border-color: #86efac;
  }

  .card {
    background: white;
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border: 1px solid #f1f5f9;
  }

  .drop-zone {
    border: 2px dashed #cbd5e1;
    border-radius: 20px;
    padding: 52px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;
    background: white;
    margin-bottom: 16px;
  }
  .drop-zone:hover, .drop-zone.over {
    border-color: #2563eb;
    background: #f0f7ff;
    box-shadow: 0 0 0 6px rgba(37,99,235,0.06);
  }

  .flag-item {
    border-left: 4px solid #f43f5e;
    background: #fff5f6;
    border-radius: 0 12px 12px 0;
    padding: 16px 18px;
    transition: transform 0.2s ease;
  }
  .flag-item:hover { transform: translateX(3px); }

  .step-badge {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .how-card {
    text-align: center;
    padding: 28px 20px;
    border-radius: 16px;
    background: white;
    border: 1px solid #f1f5f9;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .nav-link {
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: color 0.2s;
  }
  .nav-link:hover { color: #2563eb; }

  .doc-tag {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
`

const scoreConfig = {
  GREEN:  { label: 'Looks Fair',         bg: '#f0fdf4', border: '#86efac', text: '#15803d', pillBg: '#dcfce7', icon: '✓' },
  YELLOW: { label: 'Review These Items', bg: '#fffbeb', border: '#fcd34d', text: '#b45309', pillBg: '#fef3c7', icon: '!' },
  RED:    { label: 'Red Flags Found',    bg: '#fff5f6', border: '#fda4af', text: '#be123c', pillBg: '#ffe4e6', icon: '✕' },
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [disputeLetter, setDisputeLetter] = useState('')
  const [loadingLetter, setLoadingLetter] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState('English')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#94a3b8', fontFamily: 'Nunito, sans-serif' }}>Loading...</p>
    </div>
  )
  if (!session) return <AuthPage />

  const extractTextFromPDF = async (uploadedFile) => {
    const arrayBuffer = await uploadedFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map(item => item.str).join(' ') + '\n'
    }
    return fullText
  }

  const handleFile = async (uploadedFile) => {
    if (!uploadedFile) return
    setFile(uploadedFile)
    setAnalysis(null)
    setDisputeLetter('')
    setError('')
    try {
      let text = ''
      if (uploadedFile.type === 'application/pdf') {
        text = await extractTextFromPDF(uploadedFile)
      } else if (uploadedFile.type === 'text/plain') {
        text = await uploadedFile.text()
      } else {
        setError('Please upload a PDF or TXT file.')
        return
      }
      if (text.trim().length < 50) {
        setError('Could not extract enough text. Try a different file.')
        return
      }
      setExtractedText(text)
    } catch {
      setError('Failed to read file. Please try again.')
    }
  }

  const analyzeDocument = async () => {
    if (!extractedText) return
    setLoading(true)
    setError('')
    setAnalysis(null)
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
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `You are a team of specialized experts — a medical billing auditor, tenant rights attorney, corporate lawyer, and consumer rights advocate. 

Analyze this document and identify what TYPE it is first, then apply the relevant expert knowledge.

For HOSPITAL BILLS look for: duplicate charges, upcoding, unbundling of services, charges for services not rendered, inflated supply costs, incorrect insurance adjustments.

For LEASE AGREEMENTS look for: automatic renewal clauses, illegal entry rights, waived habitability rights, excessive fees, security deposit tricks, one-sided maintenance clauses, early termination penalties.

For CONTRACTS/NDAs look for: overly broad IP assignment, non-compete overreach, unlimited liability clauses, one-sided termination rights, forced arbitration, personal guarantee clauses.

For TERMS OF SERVICE look for: data selling to third parties, automatic subscription renewals, waived class action rights, account termination without notice, hidden fee triggers, privacy rights waivers.

For UTILITY BILLS look for: unexplained fee increases, junk fees, rate change notices buried in fine print, estimated vs actual charges.

Be specific — don't say "review this clause", say exactly WHY it's unusual and what the real world consequence is for the user.

Respond ONLY in this exact JSON format, nothing else:
{
  "documentType": "specific type of document",
  "summary": "2-3 sentence plain English summary of what this document is",
  "score": "GREEN or YELLOW or RED",
  "scoreReason": "one sentence explaining the score",
  "redFlags": [
    {"title": "specific flag title", "description": "plain English explanation of WHY this is a problem and what it means for YOU"}
  ],
  "normalItems": ["standard item that looks fair"],
  "actionItems": ["specific action the person should take, not generic advice"]
}

Score guide:
- GREEN: Standard terms, nothing unusual
- YELLOW: Some clauses worth negotiating or questioning  
- RED: Serious issues — do not sign without legal advice
Respond entirely in ${language}. All fields including summary, redFlags, normalItems, and actionItems must be written in ${language}.

Document to analyze:
${extractedText.slice(0, 8000)}`
          }]
        })
      })
      const data = await res.json()
      if (data.error) { setError('API Error: ' + data.error.message); return }
      const clean = data.content[0].text.replace(/```json|```/g, '').trim()
      setAnalysis(JSON.parse(clean))
    } catch {
      setError('Analysis failed. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateDisputeLetter = async () => {
    if (!analysis) return
    setLoadingLetter(true)
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
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: 'Write a professional dispute letter for a ' + analysis.documentType + ' addressing these red flags: ' + JSON.stringify(analysis.redFlags) + '. Be firm, professional, and specific. Just write the letter.'
          }]
        })
      })
      const data = await res.json()
      setDisputeLetter(data.content[0].text)
    } catch {
      setError('Failed to generate letter.')
    } finally {
      setLoadingLetter(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setExtractedText('')
    setAnalysis(null)
    setDisputeLetter('')
    setError('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(disputeLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* Navbar */}
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #f1f5f9',
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔍</div>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>ClearSign</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="#how" className="nav-link">How it works</a>
            <a href="#upload" className="nav-link">Try it free</a>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* Hero */}
        {!analysis && (
          <div className="hero-bg fade-up" style={{ padding: '72px 24px 60px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '6px 16px', marginBottom: '24px' }}>
              <span>⚡</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>AI-Powered Document Analysis</span>
            </div>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: '52px', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, maxWidth: '640px', margin: '0 auto 20px' }}>
              Understand any document<br />
              <span style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                before you sign.
              </span>
            </h1>
            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '480px', margin: '0 auto 36px', lineHeight: 1.65, fontWeight: 500 }}>
              Upload a lease, hospital bill, contract, or terms of service. Get an instant AI breakdown with red flags highlighted.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
              {['🏥 Hospital Bills', '🏠 Lease Agreements', '📋 Contracts', '📄 Terms of Service'].map(tag => (
                <span key={tag} className="doc-tag">{tag}</span>
              ))}
            </div>
            <div className="float" style={{ fontSize: '80px' }}>📑</div>
          </div>
        )}

        {/* How it works */}
        {!analysis && (
          <div id="how" style={{ padding: '60px 24px', maxWidth: '860px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Lora, serif', textAlign: 'center', fontSize: '30px', fontWeight: 700, color: '#0f172a', marginBottom: '40px' }}>How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { step: 1, icon: '⬆️', title: 'Upload your doc',  desc: 'PDF or TXT — any document you need reviewed' },
                { step: 2, icon: '🤖', title: 'AI reads it all',  desc: 'Claude AI analyzes every clause and charge' },
                { step: 3, icon: '🚨', title: 'See red flags',    desc: 'Unusual terms and charges are highlighted instantly' },
                { step: 4, icon: '✍️', title: 'Take action',      desc: 'Get a ready-to-send dispute letter in one click' },
              ].map(item => (
                <div key={item.step} className="how-card">
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div className="step-badge" style={{ width: '24px', height: '24px', fontSize: '11px' }}>{item.step}</div>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload + Results */}
        <div id="upload" style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>

          {!analysis && (
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Analyze Your Document</h2>
              <p style={{ color: '#64748b', fontSize: '15px' }}>Free, instant, and private — your document never leaves your browser</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>🌍 Explain results in:</span>
  <select
    value={language}
    onChange={(e) => setLanguage(e.target.value)}
    style={{
      padding: '8px 16px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      fontWeight: 600,
      color: '#0f172a',
      background: 'white',
      cursor: 'pointer',
      fontFamily: 'Nunito, sans-serif',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}
  >
    <option>English</option>
    <option>Spanish</option>
    <option>Vietnamese</option>
    <option>Chinese (Simplified)</option>
    <option>French</option>
    <option>Korean</option>
    <option>Portuguese</option>
  </select>
</div>
            </div>
          )}

          {/* Drop Zone */}
          {!analysis && (
            <div
              className={'drop-zone fade-up-1' + (dragOver ? ' over' : '')}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input id="fileInput" type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>📄</div>
                  <p style={{ fontSize: '17px', fontWeight: 800, color: '#2563eb', marginBottom: '4px' }}>{file.name}</p>
                  <p style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>✓ Ready to analyze</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '52px', marginBottom: '16px' }}>⬆️</div>
                  <p style={{ fontSize: '17px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Drop your document here</p>
                  <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>or click to browse your files</p>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>PDF</span>
                    <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>TXT</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="fade-up" style={{ background: '#fff5f6', border: '1px solid #fda4af', borderRadius: '14px', padding: '14px 18px', color: '#be123c', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Analyze Button */}
          {extractedText && !analysis && !loading && (
            <button className="btn-main fade-up-2" onClick={analyzeDocument}>
              🔍 Analyze My Document
            </button>
          )}

          {/* Loading */}
          {loading && (
            <div className="card fade-up" style={{ textAlign: 'center', padding: '52px' }}>
              <div className="spin" style={{ width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 20px' }} />
              <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Analyzing your document...</p>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Reading every clause so you don't have to</p>
            </div>
          )}

          {/* Results */}
          {analysis && (() => {
            const sc = scoreConfig[analysis.score] || scoreConfig.YELLOW
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Score Card */}
                <div className="fade-up-1" style={{ background: sc.bg, border: '2px solid ' + sc.border, borderRadius: '20px', padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ background: 'white', color: '#64748b', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '10px', border: '1px solid #e2e8f0' }}>{analysis.documentType}</span>
                      <h2 style={{ fontFamily: 'Lora, serif', fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{sc.label}</h2>
                      <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.5 }}>{analysis.scoreReason}</p>
                    </div>
                    <div style={{ background: sc.pillBg, color: sc.text, borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 900 }}>
                      {sc.icon}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="card fade-up-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '20px' }}>📋</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Summary</h3>
                  </div>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7 }}>{analysis.summary}</p>
                </div>

                {/* Red Flags */}
                {analysis.redFlags && analysis.redFlags.length > 0 && (
                  <div className="card fade-up-3">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '20px' }}>🚨</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Red Flags</h3>
                      <span style={{ background: '#ffe4e6', color: '#be123c', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 800 }}>{analysis.redFlags.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {analysis.redFlags.map((flag, i) => (
                        <div key={i} className="flag-item">
                          <p style={{ fontWeight: 800, color: '#be123c', fontSize: '14px', marginBottom: '4px' }}>{flag.title}</p>
                          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{flag.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Normal Items */}
                {analysis.normalItems && analysis.normalItems.length > 0 && (
                  <div className="card fade-up-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Standard Items</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysis.normalItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#475569', alignItems: 'flex-start' }}>
                          <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {analysis.actionItems && analysis.actionItems.length > 0 && (
                  <div className="card fade-up-5">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '20px' }}>👉</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>What You Should Do</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysis.actionItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#475569', alignItems: 'flex-start', lineHeight: 1.6 }}>
                          <div className="step-badge">{i + 1}</div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dispute Letter Button */}
                <button className="btn-dispute" onClick={generateDisputeLetter} disabled={loadingLetter}>
                  {loadingLetter ? '✍️ Writing your letter...' : '📝 Generate Dispute Letter'}
                </button>

                {/* Dispute Letter Output */}
                {disputeLetter && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>📝 Dispute Letter</h3>
                      <button className={'btn-copy' + (copied ? ' copied' : '')} onClick={handleCopy}>
                        {copied ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'Nunito, sans-serif', lineHeight: 1.7 }}>{disputeLetter}</pre>
                  </div>
                )}

                {/* Reset Button */}
                <button className="btn-reset" onClick={handleReset}>
                  ↑ Analyze Another Document
                </button>

              </div>
            )
          })()}
        </div>

        {/* Footer */}
        <footer style={{ background: 'white', borderTop: '1px solid #f1f5f9', padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔍</div>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>ClearSign</span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Built with ❤️ at Hacklanta · Powered by Claude AI</p>
        </footer>

      </div>
    </>
  )
}