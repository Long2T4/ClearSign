import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import heic2any from 'heic2any'
import { supabase } from './lib/supabase'
import AuthPage from './components/AuthPage'
import ChatBot from './components/ChatBot'

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
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
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

  .dropdown-item {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: background 0.15s;
    background: white;
  }
  .dropdown-item:hover { background: #f8fafc; }

  .history-card {
    background: white;
    border-radius: 16px;
    padding: 18px 20px;
    border: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .history-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-1px);
  }
`

const scoreConfig = {
  GREEN:  { label: 'Looks Fair',         bg: '#f0fdf4', border: '#86efac', text: '#15803d', pillBg: '#dcfce7', icon: '✓' },
  YELLOW: { label: 'Review These Items', bg: '#fffbeb', border: '#fcd34d', text: '#b45309', pillBg: '#fef3c7', icon: '!' },
  RED:    { label: 'Red Flags Found',    bg: '#fff5f6', border: '#fda4af', text: '#be123c', pillBg: '#ffe4e6', icon: '✕' },
}

export default function App() {
  const [session, setSession] = useState(undefined)
  // Profile
  const [showProfile, setShowProfile] = useState(false)
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')
  // MFA
  const [mfaFactors, setMfaFactors] = useState([])
  const [mfaEnrolling, setMfaEnrolling] = useState(false)
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaEnrollFactorId, setMfaEnrollFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaMsg, setMfaMsg] = useState('')
  const [mfaError, setMfaError] = useState('')
  // Core
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
  const [showAuth, setShowAuth] = useState(false)
  // Dropdown + History
  const [showDropdown, setShowDropdown] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [submissionId, setSubmissionId] = useState(null)
  const [historyLetterLoading, setHistoryLetterLoading] = useState(false)
  const [historyCopied, setHistoryCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    const handlePopState = () => setShowAuth(false)
    window.addEventListener('popstate', handlePopState)
    const handleClick = () => setShowDropdown(false)
    window.addEventListener('click', handleClick)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('click', handleClick)
    }
  }, [])

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
      const { type, name } = uploadedFile
      const isHeic = type === 'image/heic' || type === 'image/heif' || name.toLowerCase().endsWith('.heic') || name.toLowerCase().endsWith('.heif')
      const isImage = type.startsWith('image/') || isHeic
      const isDocx = type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')

      if (isImage) {
        let imageFile = uploadedFile
        if (isHeic) {
          const converted = await heic2any({ blob: uploadedFile, toType: 'image/jpeg', quality: 0.85 })
          imageFile = new File([converted], name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
        }
        const reader = new FileReader()
        reader.onload = (e) => setExtractedText('__IMAGE__:' + e.target.result)
        reader.readAsDataURL(imageFile)
        return
      }

      let text = ''
      if (type === 'application/pdf') {
        text = await extractTextFromPDF(uploadedFile)
      } else if (type === 'text/plain') {
        text = await uploadedFile.text()
      } else if (isDocx) {
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } else {
        setError('Please upload a PDF, DOCX, TXT, or image file.')
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

  const saveToHistory = async (analysisResult) => {
    if (!session) return
    try {
      const { data } = await supabase.from('submissions').insert({
        user_id: session.user.id,
        file_name: file?.name || 'Unknown',
        document_type: analysisResult.documentType,
        score: analysisResult.score,
        analysis: analysisResult,
      }).select('id').single()
      if (data) setSubmissionId(data.id)
    } catch (err) { console.error('Failed to save history:', err) }
  }

  const fetchHistory = async () => {
    if (!session) return
    setHistoryLoading(true)
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
      setHistory(data || [])
    } catch (err) { console.error('Failed to fetch history:', err) }
    finally { setHistoryLoading(false) }
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
            content: extractedText.startsWith('__IMAGE__:') ? [
              {
                type: 'image',
                source: { type: 'base64', media_type: file.type, data: extractedText.replace('__IMAGE__:', '').split(',')[1] }
              },
              {
                type: 'text',
                text: `You are a document analysis expert. Analyze this document image and respond ONLY in this exact JSON format:\n{"documentType":"...","summary":"...","score":"GREEN or YELLOW or RED","scoreReason":"...","redFlags":[{"title":"...","description":"..."}],"normalItems":["..."],"actionItems":["..."]}\nRespond in ${language}.`
              }
            ] : `You are a team of specialized experts — a medical billing auditor, tenant rights attorney, corporate lawyer, and consumer rights advocate. 

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
      const parsed = JSON.parse(clean)
      setAnalysis(parsed)
      saveToHistory(parsed)
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
      const letter = data.content[0].text
      setDisputeLetter(letter)
      if (session && submissionId) {
        await supabase.from('submissions').update({ dispute_letter: letter }).eq('id', submissionId)
      }
    } catch {
      setError('Failed to generate letter.')
    } finally {
      setLoadingLetter(false)
    }
  }

  const generateLetterForHistory = async (historyItem) => {
    setHistoryLetterLoading(true)
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
            content: 'Write a professional dispute letter for a ' + historyItem.document_type + ' addressing these red flags: ' + JSON.stringify(historyItem.analysis.redFlags) + '. Be firm, professional, and specific. Just write the letter.'
          }]
        })
      })
      const data = await res.json()
      const letter = data.content[0].text
      await supabase.from('submissions').update({ dispute_letter: letter }).eq('id', historyItem.id)
      const updated = { ...historyItem, dispute_letter: letter }
      setSelectedHistory(updated)
      setHistory(prev => prev.map(h => h.id === historyItem.id ? updated : h))
    } catch {
      // silent — user can retry
    } finally {
      setHistoryLetterLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setExtractedText('')
    setAnalysis(null)
    setDisputeLetter('')
    setError('')
    setSubmissionId(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(disputeLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadMfaFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    setMfaFactors((data?.totp || []).filter(f => f.status === 'verified'))
  }

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* Navbar */}
        <nav style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <div onClick={() => { setShowAuth(false); handleReset() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔍</div>
            <span style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>ClearSign</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="#how" className="nav-link">How it works</a>
            <a href="#upload" className="nav-link">Try it free</a>

            {session ? (
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontWeight: 800, fontSize: '15px', userSelect: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
                >
                  {session.user.email[0].toUpperCase()}
                </div>
                {showDropdown && (
                  <div style={{ position: 'absolute', top: '48px', right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', width: '220px', overflow: 'hidden', zIndex: 200 }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '16px', marginBottom: '8px' }}>
                        {session.user.email[0].toUpperCase()}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{session.user.email.split('@')[0]}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{session.user.email}</p>
                    </div>
                    <div className="dropdown-item" onClick={() => { setShowDropdown(false); setShowProfile(true); setPwMessage(''); setPwError(''); setMfaEnrolling(false); setMfaMsg(''); setMfaError(''); loadMfaFactors() }}>
                      <span style={{ fontSize: '16px' }}>👤</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Profile</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { setShowDropdown(false); setShowHistory(true); fetchHistory() }}>
                      <span style={{ fontSize: '16px' }}>🕐</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>History</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { supabase.auth.signOut(); setShowDropdown(false) }} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '16px' }}>🚪</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#be123c' }}>Sign out</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); window.history.pushState({}, '', '/login') }}
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
              >
                Sign in
              </button>
            )}
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
                { step: 1, icon: '⬆️', title: 'Upload your doc', desc: 'PDF, DOCX, image — any document you need reviewed' },
                { step: 2, icon: '🤖', title: 'AI reads it all', desc: 'Claude AI analyzes every clause and charge' },
                { step: 3, icon: '🚨', title: 'See red flags', desc: 'Unusual terms and charges are highlighted instantly' },
                { step: 4, icon: '✍️', title: 'Take action', desc: 'Get a ready-to-send dispute letter in one click' },
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
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, color: '#0f172a', background: 'white', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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

          {!analysis && (
            <div
              className={'drop-zone fade-up-1' + (dragOver ? ' over' : '')}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input id="fileInput" type="file" accept=".pdf,.txt,.docx,.heic,.heif,image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
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
                  <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>PDF</span>
                    <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>DOCX</span>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>TXT</span>
                    <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>Image</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="fade-up" style={{ background: '#fff5f6', border: '1px solid #fda4af', borderRadius: '14px', padding: '14px 18px', color: '#be123c', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          {extractedText && !analysis && !loading && (
            <button className="btn-main fade-up-2" onClick={analyzeDocument}>
              🔍 Analyze My Document
            </button>
          )}

          {loading && (
            <div className="card fade-up" style={{ textAlign: 'center', padding: '52px' }}>
              <div className="spin" style={{ width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 20px' }} />
              <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Analyzing your document...</p>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Reading every clause so you don't have to</p>
            </div>
          )}

          {analysis && (() => {
            const sc = scoreConfig[analysis.score] || scoreConfig.YELLOW
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="fade-up-1" style={{ background: sc.bg, border: '2px solid ' + sc.border, borderRadius: '20px', padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ background: 'white', color: '#64748b', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: '10px', border: '1px solid #e2e8f0' }}>{analysis.documentType}</span>
                      <h2 style={{ fontFamily: 'Lora, serif', fontSize: '26px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{sc.label}</h2>
                      <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.5 }}>{analysis.scoreReason}</p>
                    </div>
                    <div style={{ background: sc.pillBg, color: sc.text, borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 900 }}>{sc.icon}</div>
                  </div>
                </div>

                <div className="card fade-up-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '20px' }}>📋</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Summary</h3>
                  </div>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.7 }}>{analysis.summary}</p>
                </div>

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

                <button className="btn-dispute" onClick={generateDisputeLetter} disabled={loadingLetter}>
                  {loadingLetter ? '✍️ Writing your letter...' : '📝 Generate Dispute Letter'}
                </button>

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

                <button className="btn-reset" onClick={handleReset}>
                  ↑ Analyze Another Document
                </button>
              </div>
            )
          })()}
        </div>

        {/* History Panel */}
        {showHistory && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 998, display: 'flex' }}>
            <div onClick={() => { setShowHistory(false); setSelectedHistory(null) }} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '520px', background: '#f8fafc', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease' }}>
              <div style={{ padding: '24px 28px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontFamily: 'Lora, serif', fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>Your History</h2>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>{history.length} document{history.length !== 1 ? 's' : ''} analyzed</p>
                </div>
                <button onClick={() => { setShowHistory(false); setSelectedHistory(null) }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="spin" style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading your history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>No history yet</p>
                    <p style={{ fontSize: '14px', color: '#94a3b8' }}>Analyze a document and it will appear here</p>
                  </div>
                ) : selectedHistory ? (
                  <div>
                    <button onClick={() => setSelectedHistory(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '14px', fontWeight: 700, fontFamily: 'Nunito, sans-serif', marginBottom: '20px', padding: 0 }}>← Back to list</button>
                    <div style={{ background: scoreConfig[selectedHistory.score]?.bg || '#f8fafc', border: '2px solid ' + (scoreConfig[selectedHistory.score]?.border || '#e2e8f0'), borderRadius: '16px', padding: '20px', marginBottom: '12px' }}>
                      <span style={{ background: 'white', color: '#64748b', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'inline-block', marginBottom: '8px', border: '1px solid #e2e8f0' }}>{selectedHistory.document_type}</span>
                      <h3 style={{ fontFamily: 'Lora, serif', fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{scoreConfig[selectedHistory.score]?.label || selectedHistory.score}</h3>
                      <p style={{ fontSize: '13px', color: '#475569' }}>{selectedHistory.analysis?.scoreReason}</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Summary</p>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>{selectedHistory.analysis?.summary}</p>
                    </div>
                    {selectedHistory.analysis?.redFlags?.length > 0 && (
                      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>🚨 Red Flags</p>
                        {selectedHistory.analysis.redFlags.map((flag, i) => (
                          <div key={i} style={{ borderLeft: '3px solid #f43f5e', background: '#fff5f6', borderRadius: '0 10px 10px 0', padding: '12px 14px', marginBottom: '8px' }}>
                            <p style={{ fontWeight: 700, color: '#be123c', fontSize: '13px', marginBottom: '3px' }}>{flag.title}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{flag.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedHistory.analysis?.actionItems?.length > 0 && (
                      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>👉 Action Items</p>
                        {selectedHistory.analysis.actionItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#475569', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div className="step-badge" style={{ width: '20px', height: '20px', fontSize: '10px', flexShrink: 0 }}>{i + 1}</div>
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedHistory.dispute_letter ? (
                      <div style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>📝 Dispute Letter</p>
                          <button className={'btn-copy' + (historyCopied ? ' copied' : '')} onClick={() => { navigator.clipboard.writeText(selectedHistory.dispute_letter); setHistoryCopied(true); setTimeout(() => setHistoryCopied(false), 2000) }}>
                            {historyCopied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'Nunito, sans-serif', lineHeight: 1.7 }}>{selectedHistory.dispute_letter}</pre>
                      </div>
                    ) : selectedHistory.analysis?.redFlags?.length > 0 && (
                      <button className="btn-dispute" onClick={() => generateLetterForHistory(selectedHistory)} disabled={historyLetterLoading} style={{ width: '100%' }}>
                        {historyLetterLoading ? '✍️ Writing your letter...' : '📝 Generate Dispute Letter'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {history.map((item) => (
                      <div key={item.id} className="history-card" onClick={() => setSelectedHistory(item)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '16px' }}>📄</span>
                              <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.file_name}</p>
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>{item.document_type} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{item.analysis?.summary?.slice(0, 80)}...</p>
                          </div>
                          <div style={{ background: scoreConfig[item.score]?.pillBg || '#f8fafc', color: scoreConfig[item.score]?.text || '#64748b', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>{item.score}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfile && session && (
          <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>My Profile</h2>
                <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', padding: '16px', background: '#f8fafc', borderRadius: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 800, flexShrink: 0 }}>
                  {session.user.email[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{session.user.email}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>ClearSign account</p>
                </div>
              </div>

              {/* Personal Information */}
              <button onClick={() => { setShowPersonalInfo(!showPersonalInfo); setPwMessage(''); setPwError(''); setCurrentPassword(''); setNewPassword('') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Personal Information</span>
                <span style={{ fontSize: '16px', color: '#94a3b8', transition: 'transform 0.2s', transform: showPersonalInfo ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {showPersonalInfo && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Change Password</p>
                  <input type="password" placeholder="Current password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPwMessage(''); setPwError('') }} style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwMessage(''); setPwError('') }} style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                  {pwError && <p style={{ fontSize: '13px', color: '#be123c' }}>⚠️ {pwError}</p>}
                  {pwMessage && <p style={{ fontSize: '13px', color: '#15803d' }}>✓ {pwMessage}</p>}
                  <button
                    onClick={async () => {
                      if (!currentPassword) { setPwError('Please enter your current password.'); return }
                      if (newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return }
                      setPwLoading(true); setPwError(''); setPwMessage('')
                      const { error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: currentPassword })
                      if (signInError) { setPwError('Current password is incorrect.'); setPwLoading(false); return }
                      const { error } = await supabase.auth.updateUser({ password: newPassword })
                      if (error) setPwError(error.message)
                      else { setPwMessage('Password updated successfully!'); setCurrentPassword(''); setNewPassword('') }
                      setPwLoading(false)
                    }}
                    disabled={pwLoading}
                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', opacity: pwLoading ? 0.6 : 1 }}
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

              {/* Two-Factor Auth */}
              <button onClick={() => { setMfaEnrolling(!mfaEnrolling); setMfaQrCode(''); setMfaCode(''); setMfaMsg(''); setMfaError('') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#374151', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Two-Factor Auth</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: mfaFactors.length > 0 ? '#dcfce7' : '#f1f5f9', color: mfaFactors.length > 0 ? '#15803d' : '#64748b' }}>
                    {mfaFactors.length > 0 ? 'Enabled' : 'Off'}
                  </span>
                </div>
                <span style={{ fontSize: '16px', color: '#94a3b8', transition: 'transform 0.2s', transform: mfaEnrolling ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {mfaEnrolling && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mfaFactors.length > 0 ? (
                    <>
                      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>Two-factor authentication is currently enabled. Your account is protected.</p>
                      {mfaError && <p style={{ fontSize: '13px', color: '#be123c' }}>⚠️ {mfaError}</p>}
                      {mfaMsg && <p style={{ fontSize: '13px', color: '#15803d' }}>✓ {mfaMsg}</p>}
                      <button onClick={async () => { setMfaLoading(true); setMfaError(''); setMfaMsg(''); const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactors[0].id }); if (error) setMfaError(error.message); else { setMfaMsg('Two-factor auth disabled.'); await loadMfaFactors() } setMfaLoading(false) }} disabled={mfaLoading} style={{ width: '100%', padding: '12px', background: '#fff5f6', color: '#be123c', border: '1px solid #fda4af', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                        {mfaLoading ? 'Disabling...' : 'Disable Two-Factor Auth'}
                      </button>
                    </>
                  ) : mfaQrCode ? (
                    <>
                      <p style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Scan with Google Authenticator, Authy, or any authenticator app:</p>
                      <img src={mfaQrCode} alt="MFA QR Code" style={{ width: '180px', height: '180px', alignSelf: 'center', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                      <input type="text" inputMode="numeric" placeholder="Enter 6-digit code" value={mfaCode} onChange={e => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMfaError('') }} style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '18px', fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', letterSpacing: '6px', textAlign: 'center' }} />
                      {mfaError && <p style={{ fontSize: '13px', color: '#be123c' }}>⚠️ {mfaError}</p>}
                      {mfaMsg && <p style={{ fontSize: '13px', color: '#15803d' }}>✓ {mfaMsg}</p>}
                      <button onClick={async () => { if (mfaCode.length !== 6) { setMfaError('Enter the 6-digit code from your app.'); return } setMfaLoading(true); setMfaError(''); const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId: mfaEnrollFactorId }); if (ce) { setMfaError(ce.message); setMfaLoading(false); return } const { error } = await supabase.auth.mfa.verify({ factorId: mfaEnrollFactorId, challengeId: challenge.id, code: mfaCode }); if (error) setMfaError(error.message); else { setMfaMsg('Two-factor auth enabled!'); setMfaQrCode(''); setMfaCode(''); await loadMfaFactors() } setMfaLoading(false) }} disabled={mfaLoading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', opacity: mfaLoading ? 0.6 : 1 }}>
                        {mfaLoading ? 'Verifying...' : 'Verify & Enable MFA'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>Add an extra layer of security. You'll need a code from your authenticator app each time you sign in.</p>
                      {mfaError && <p style={{ fontSize: '13px', color: '#be123c' }}>⚠️ {mfaError}</p>}
                      <button onClick={async () => { setMfaLoading(true); setMfaError(''); const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' }); if (error) setMfaError(error.message); else { setMfaQrCode(data.totp.qr_code); setMfaEnrollFactorId(data.id) } setMfaLoading(false) }} disabled={mfaLoading} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', opacity: mfaLoading ? 0.6 : 1 }}>
                        {mfaLoading ? 'Setting up...' : 'Enable Two-Factor Auth'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auth */}
        {showAuth && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'white' }}>
            <AuthPage onSuccess={() => setShowAuth(false)} />
          </div>
        )}

        {/* Chatbot */}
        <ChatBot />

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