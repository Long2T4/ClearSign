import { useState, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from './lib/supabase'
import AuthPage from './components/AuthPage'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function App() {
  const [session, setSession] = useState(undefined)
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [disputeLetter, setDisputeLetter] = useState('')
  const [loadingLetter, setLoadingLetter] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )
  if (!session) return <AuthPage />

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      fullText += content.items.map(item => item.str).join(' ') + '\n'
    }
    return fullText
  }

  const extractTextFromTxt = async (file) => {
    return await file.text()
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
        text = await extractTextFromTxt(uploadedFile)
      } else {
        setError('Please upload a PDF or TXT file.')
        return
      }

      if (text.trim().length < 50) {
        setError('Could not extract enough text from this file. Try a different PDF.')
        return
      }

      setExtractedText(text)
    } catch (err) {
      setError('Failed to read file. Please try again.')
    }
  }

  const analyzeDocument = async () => {
    if (!extractedText) return
    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
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
          messages: [
            {
              role: 'user',
              content: `You are a legal and financial document analyzer. Analyze the following document and respond ONLY in this exact JSON format, nothing else:

{
  "documentType": "what type of document this is",
  "summary": "2-3 sentence plain English summary of what this document is about",
  "score": "GREEN or YELLOW or RED",
  "scoreReason": "one sentence explaining the score",
  "redFlags": [
    {"title": "flag title", "description": "plain English explanation of why this is concerning"},
    {"title": "flag title", "description": "plain English explanation of why this is concerning"}
  ],
  "normalItems": [
    "one normal/standard item",
    "another normal item"
  ],
  "actionItems": [
    "specific action the person should take",
    "another action item"
  ]
}

Score meanings:
- GREEN: Looks fair, standard terms
- YELLOW: A few things worth reviewing
- RED: Serious issues found, do not sign without legal advice

Document to analyze:
${extractedText.slice(0, 8000)}`
            }
          ]
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(`API Error: ${data.error.message}`)
        return
      }

      const text = data.content[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setAnalysis(parsed)
    } catch (err) {
      setError('Analysis failed. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateDisputeLetter = async () => {
    if (!analysis) return
    setLoadingLetter(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
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
          messages: [
            {
              role: 'user',
              content: `Write a professional dispute/negotiation letter based on these red flags found in a ${analysis.documentType}:

Red flags: ${JSON.stringify(analysis.redFlags)}

The letter should:
- Be professional and firm
- Reference each red flag specifically
- Request clarification or changes
- Be ready to send

Just write the letter, no explanation needed.`
            }
          ]
        })
      })

      const data = await response.json()
      setDisputeLetter(data.content[0].text)
    } catch (err) {
      setError('Failed to generate letter.')
    } finally {
      setLoadingLetter(false)
    }
  }

  const scoreColor = {
    GREEN: 'bg-green-100 text-green-800 border-green-300',
    YELLOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    RED: 'bg-red-100 text-red-800 border-red-300',
  }

  const scoreEmoji = { GREEN: '🟢', YELLOW: '🟡', RED: '🔴' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">ClearSign</h1>
              <p className="text-sm text-gray-500">Understand any document before you sign</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="text-5xl mb-4">📄</div>
          {file ? (
            <div>
              <p className="text-lg font-semibold text-blue-600">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">✅ File loaded — click Analyze below</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-gray-700">Drop your document here</p>
              <p className="text-sm text-gray-400 mt-1">Supports PDF and TXT — lease, hospital bill, contract, terms of service</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Analyze Button */}
        {extractedText && !analysis && (
          <button
            onClick={analyzeDocument}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 rounded-xl text-lg transition-all"
          >
            {loading ? '🤖 Analyzing your document...' : '🔍 Analyze Document'}
          </button>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-4">

            {/* Score Card */}
            <div className={`border-2 rounded-2xl p-6 ${scoreColor[analysis.score]}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{scoreEmoji[analysis.score]}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{analysis.documentType}</p>
                  <p className="text-xl font-bold">{analysis.score === 'GREEN' ? 'Looks Fair' : analysis.score === 'YELLOW' ? 'Review These Items' : 'Red Flags Found'}</p>
                </div>
              </div>
              <p className="text-sm">{analysis.scoreReason}</p>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h2 className="font-bold text-gray-800 text-lg mb-2">📋 Summary</h2>
              <p className="text-gray-600">{analysis.summary}</p>
            </div>

            {/* Red Flags */}
            {analysis.redFlags?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-bold text-gray-800 text-lg mb-4">🚨 Red Flags</h2>
                <div className="space-y-3">
                  {analysis.redFlags.map((flag, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="font-semibold text-red-800">⚠️ {flag.title}</p>
                      <p className="text-red-700 text-sm mt-1">{flag.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Normal Items */}
            {analysis.normalItems?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-bold text-gray-800 text-lg mb-4">✅ Standard Items</h2>
                <ul className="space-y-2">
                  {analysis.normalItems.map((item, i) => (
                    <li key={i} className="text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {analysis.actionItems?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-bold text-gray-800 text-lg mb-4">👉 What You Should Do</h2>
                <ul className="space-y-2">
                  {analysis.actionItems.map((item, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500 font-bold">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dispute Letter */}
            <button
              onClick={generateDisputeLetter}
              disabled={loadingLetter}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-xl text-lg transition-all"
            >
              {loadingLetter ? '✍️ Writing letter...' : '📝 Generate Dispute Letter'}
            </button>

            {disputeLetter && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-gray-800 text-lg">📝 Dispute Letter</h2>
                  <button
                    onClick={() => navigator.clipboard.writeText(disputeLetter)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-gray-600"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-gray-600 text-sm whitespace-pre-wrap font-sans">{disputeLetter}</pre>
              </div>
            )}

            {/* Analyze Another */}
            <button
              onClick={() => { setFile(null); setExtractedText(''); setAnalysis(null); setDisputeLetter(''); setError('') }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
            >
              📤 Upload Another Document
            </button>

          </div>
        )}
      </div>
    </div>
  )
}

export default App