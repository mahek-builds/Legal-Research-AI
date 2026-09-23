import { useState, useRef, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'ready' | 'failed'
type SearchScope = 'documents' | 'web' | 'both'
type AgentStep = 'understand' | 'plan' | 'retrieve' | 'reason' | 'cite'

interface Document {
  id: string
  name: string
  size: string
  status: DocStatus
  progress: number
  usedInAnswer?: boolean
}

interface Source {
  id: string
  type: 'document' | 'web'
  title: string
  authority: string
  date: string
  excerpt: string
  citation: string
  conflicting?: boolean
}

interface AnswerSection {
  title: string
  content: string
  citations?: number[]
}

interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  sections?: AnswerSection[]
  sources?: Source[]
  thinking?: boolean
  agentStep?: AgentStep
  timestamp: Date
}

interface Session {
  id: string
  title: string
  timestamp: Date
  active?: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000'

const AGENT_STEPS: AgentStep[] = ['understand', 'plan', 'retrieve', 'reason', 'cite']

const STEP_LABELS: Record<AgentStep, string> = {
  understand: 'Understand',
  plan: 'Plan',
  retrieve: 'Retrieve',
  reason: 'Reason',
  cite: 'Cite',
}

const SUGGESTED_QUERIES = [
  'What are the key elements required to establish negligence in a tort claim?',
  'Summarize the standard of review for preliminary injunctions in the Ninth Circuit.',
  'What constitutes a valid arbitration agreement under FAA § 2?',
  'Identify all statutory deadlines mentioned in the uploaded contract.',
  'Compare the uploaded judgment against Smith v. Jones — where do they conflict?',
]

// No mock data — all sessions and messages are loaded from the live API.

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DocStatus }) {
  const configs: Record<DocStatus, { label: string; color: string }> = {
    uploading:  { label: 'Uploading',  color: 'bg-navy-100 text-navy-600' },
    extracting: { label: 'Extracting', color: 'bg-navy-100 text-navy-600' },
    chunking:   { label: 'Chunking',   color: 'bg-navy-100 text-navy-600' },
    embedding:  { label: 'Embedding',  color: 'bg-navy-100 text-navy-600' },
    ready:      { label: 'Ready',      color: 'bg-emerald-50 text-emerald-700' },
    failed:     { label: 'Failed',     color: 'bg-red-50 text-red-600' },
  }
  const { label, color } = configs[status]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide uppercase ${color}`}>
      {status !== 'ready' && status !== 'failed' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  )
}

function DocUploadCard({ doc }: { doc: Document }) {
  return (
    <div className="group px-3 py-2.5 rounded-sm hover:bg-navy-50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-brass-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-xs font-medium text-navy-800 truncate">{doc.name}</span>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      {doc.status !== 'ready' && doc.status !== 'failed' && (
        <div className="h-0.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brass-400 rounded-full transition-all duration-500"
            style={{ width: `${doc.progress}%` }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-slate-500 font-mono">{doc.size}</span>
        {doc.usedInAnswer && (
          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Used in answer
          </span>
        )}
      </div>
    </div>
  )
}

function AgentStepper({ currentStep }: { currentStep: AgentStep }) {
  const currentIdx = AGENT_STEPS.indexOf(currentStep)
  return (
    <div className="flex items-center gap-1 py-2 px-3 bg-navy-900/5 rounded-sm border border-navy-100 mb-3">
      {AGENT_STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 ${active ? 'text-navy-900' : done ? 'text-brass-500' : 'text-slate-300'}`}>
              {done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : active ? (
                <span className="w-2 h-2 rounded-full bg-brass-400 animate-pulse inline-block" />
              ) : (
                <span className="w-2 h-2 rounded-full border border-current inline-block" />
              )}
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase">{STEP_LABELS[step]}</span>
            </div>
            {i < AGENT_STEPS.length - 1 && (
              <span className={`text-[10px] mx-0.5 ${i < currentIdx ? 'text-brass-300' : 'text-slate-200'}`}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CitationMarker({ num, onClick }: { num: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-mono font-bold text-brass-600 bg-brass-100 rounded-sm border border-brass-200 hover:bg-brass-200 transition-colors mx-0.5 align-super leading-none"
      aria-label={`Source ${num}`}
    >
      {num}
    </button>
  )
}

function AnswerCard({ message, onSourceClick }: { message: Message; onSourceClick: (id: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Summary: true,
    'Relevant Facts': false,
    'Applicable Law': false,
    Analysis: false,
    Conclusion: false,
  })

  function renderWithCitations(text: string, citations?: number[]) {
    if (!citations) return text
    const parts = text.split(/(\[\d+\])/)
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/)
      if (match) {
        const num = parseInt(match[1])
        const src = message.sources?.find((_, idx) => idx + 1 === num)
        return <CitationMarker key={i} num={num} onClick={() => src && onSourceClick(src.id)} />
      }
      return part
    })
  }

  return (
    <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="w-5 h-5 rounded-sm bg-navy-900 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-brass-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-navy-700 tracking-wide uppercase font-mono">LexAgent Research Analysis</span>
        {message.sources && (
          <span className="ml-auto text-[10px] font-mono text-slate-400">{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
        )}
      </div>
      {message.content && (!message.sections || message.sections.length === 0) && (
        <div className="px-4 py-4 text-sm text-red-600 bg-red-50 font-medium">
          {message.content}
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {message.sections?.map((section) => (
          <div key={section.title}>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
              onClick={() => setExpanded(e => ({ ...e, [section.title]: !e[section.title] }))}
            >
              <span className="text-xs font-semibold text-navy-800 tracking-wider uppercase font-mono">{section.title}</span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded[section.title] ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {expanded[section.title] && (
              <div className="px-4 pb-3 text-sm text-slate-700 leading-relaxed font-serif">
                {renderWithCitations(section.content, section.citations)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceCard({ source, highlighted, onClick }: { source: Source; highlighted?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-sm border p-3 transition-all hover:shadow-sm group ${
        source.conflicting
          ? 'border-amber-300 bg-amber-50/50'
          : highlighted
          ? 'border-brass-300 bg-brass-50/30'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <div className={`w-5 h-5 rounded-sm shrink-0 flex items-center justify-center ${
          source.type === 'document' ? 'bg-navy-100 text-navy-600' : 'bg-slate-100 text-slate-600'
        }`}>
          {source.type === 'document' ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-navy-800 leading-tight font-serif mb-0.5 group-hover:text-navy-900 transition-colors">{source.title}</p>
          <p className="text-[10px] text-slate-500">{source.authority}</p>
        </div>
        {source.conflicting && (
          <span className="shrink-0 text-[9px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Conflict</span>
        )}
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2 mb-1.5">"{source.excerpt}"</p>
      <p className="text-[10px] font-mono text-brass-600">{source.citation}</p>
    </button>
  )
}

function EmptyState({ onQuery, onUpload }: { onQuery: (q: string) => void, onUpload: (files: FileList) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-16 max-w-2xl mx-auto">
      <div className="w-12 h-12 rounded-sm bg-navy-900 flex items-center justify-center mb-6">
        <svg className="w-6 h-6 text-brass-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-serif font-semibold text-navy-900 text-center mb-2 leading-tight">
        Begin your research
      </h2>
      <p className="text-sm text-slate-500 text-center leading-relaxed mb-8 max-w-md">
        Upload case files, contracts, or statutes — then ask a research question. LexAgent searches your documents, live legal databases, or both.
      </p>

      {/* Upload zone */}
      <label className="w-full border border-dashed border-slate-300 rounded-sm p-6 flex flex-col items-center gap-2 hover:border-brass-400 hover:bg-brass-50/30 transition-colors cursor-pointer mb-8 group">
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUpload(e.target.files);
            }
          }} 
        />
        <svg className="w-6 h-6 text-slate-400 group-hover:text-brass-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span className="text-xs font-medium text-slate-600 group-hover:text-navy-800 transition-colors">Drop files here or click to upload</span>
        <span className="text-[10px] text-slate-400 font-mono">PDF only · up to 50 MB per file</span>
      </label>

      <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider mb-3">Suggested queries</p>
      <div className="flex flex-col gap-2 w-full">
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onQuery(q)}
            className="text-left text-xs text-slate-700 px-3 py-2.5 border border-slate-200 rounded-sm hover:border-brass-300 hover:bg-brass-50/20 hover:text-navy-800 transition-all leading-relaxed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<SearchScope>('both')
  const [docs, setDocs] = useState<Document[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState('current')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<AgentStep>('understand')
  const [activeSources, setActiveSources] = useState<Source[]>([])
  const [highlightedSource, setHighlightedSource] = useState<string | null>(null)
  const [sourceDrawer, setSourceDrawer] = useState<Source | null>(null)
  const [hasConversation, setHasConversation] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, thinking])

  async function fetchSessions() {
    try {
      const res = await fetch(`${API_BASE}/sessions`)
      if (!res.ok) return
      const data = await res.json()
      
      if (!data.sessions || data.sessions.length === 0) {
        setSessions([])
        return
      }

      const formatted = data.sessions.map((s: any) => {
        const sid = String(s.id || 'Unknown')
        return {
          id: sid,
          title: sid === 'current' ? 'Current Session' : `Session ${sid.replace('session_', '').substring(0, 4)}`,
          timestamp: s.created_at ? new Date(s.created_at) : new Date()
        }
      })
      setSessions(formatted)
    } catch (e) {
      console.error('Error fetching sessions:', e)
    }
  }

  async function loadSession(sessionId: string) {
    setActiveSession(sessionId)
    setMessages([])
    setHasConversation(false)
    setActiveSources([])
    
    try {
      const res = await fetch(`${API_BASE}/conversation/${sessionId}`)
      if (!res.ok) return
      const data = await res.json()
      
      if (data.messages && data.messages.length > 0) {
        const loadedMessages = data.messages.map((m: any) => {
          if (m.role === 'user') {
            return {
              id: m.id,
              role: 'user',
              content: m.content,
              timestamp: new Date(m.created_at)
            }
          } else {
            try {
              const answer = JSON.parse(m.content)
              return {
                id: m.id,
                role: 'agent',
                content: '',
                sections: [
                  { title: 'Summary', content: answer.summary || 'No summary provided.' },
                  ...(answer.relevant_facts?.length ? [{ title: 'Relevant Facts', content: answer.relevant_facts.join('\n') }] : []),
                  ...(answer.legal_issues?.length ? [{ title: 'Legal Issues', content: answer.legal_issues.join('\n') }] : []),
                  ...(answer.applicable_law?.length ? [{ title: 'Applicable Law', content: answer.applicable_law.join('\n') }] : []),
                  ...(answer.analysis ? [{ title: 'Analysis', content: answer.analysis }] : []),
                  ...(answer.conclusion ? [{ title: 'Conclusion', content: answer.conclusion }] : []),
                ],
                sources: answer.sources?.map((s: any, idx: number) => ({
                  id: `src-${Date.now()}-${idx}`,
                  type: s.type || 'document',
                  title: s.title || s.document_name || 'Source',
                  authority: s.authority || 'Document',
                  date: s.date || '',
                  excerpt: s.url || `Page ${s.page}`,
                  citation: s.document_name ? `${s.document_name}, p. ${s.page}` : s.url,
                })) || [],
                timestamp: new Date(m.created_at)
              }
            } catch (e) {
              return {
                id: m.id,
                role: 'agent',
                content: m.content,
                timestamp: new Date(m.created_at)
              }
            }
          }
        })
        
        setMessages(loadedMessages)
        setHasConversation(true)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  // Load conversation history on mount
  useEffect(() => {
    loadSession(activeSession)
    fetchSessions()
  }, [])

  async function handleUpload(files: FileList) {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
      setDocs(prev => [...prev, {
        id: `temp-${Date.now()}-${file.name}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'uploading',
        progress: 0,
      }])
    })

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      
      setDocs(prev => {
        const newDocs = [...prev]
        data.documents.forEach((uploadedDoc: any) => {
          const idx = newDocs.findIndex(d => d.name === uploadedDoc.filename && d.status === 'uploading')
          if (idx !== -1) {
            newDocs[idx] = {
              ...newDocs[idx],
              id: uploadedDoc.document_id,
              status: 'ready',
              progress: 100,
            }
          } else {
             newDocs.push({
               id: uploadedDoc.document_id,
               name: uploadedDoc.filename,
               size: 'Unknown',
               status: 'ready',
               progress: 100
             })
          }
        })
        return newDocs
      })
    } catch (err) {
      console.error(err)
      setDocs(prev => prev.map(d => d.status === 'uploading' ? { ...d, status: 'failed' } : d))
    }
  }

  async function handleQuery(q?: string) {
    const text = q ?? query.trim()
    if (!text) return
    setQuery('')
    setHasConversation(true)

    const userMsg: Message = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setThinking(true)
    setThinkingStep('understand')
    if (!sourcesOpen) setSourcesOpen(true)

    const steps: AgentStep[] = ['understand', 'plan', 'retrieve', 'reason', 'cite']
    let stepInterval = setInterval(() => {
      setThinkingStep(prev => {
        const idx = steps.indexOf(prev)
        return idx < steps.length - 1 ? steps[idx + 1] : prev
      })
    }, 1500)

    try {
      const res = await fetch(`${API_BASE}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          question: text,
          document_ids: docs.filter(d => d.status === 'ready').map(d => d.id)
        })
      })
      if (!res.ok) {
        let errDetail = `Server returned status ${res.status}`
        try {
          const errData = await res.json()
          if (errData.detail) errDetail = errData.detail
          else if (errData.message) errDetail = errData.message
        } catch {
          // fallback to status
        }
        throw new Error(errDetail)
      }
      const data = await res.json()

      clearInterval(stepInterval)
      setThinking(false)

      const answer = data.answer || {}
      
      const sections: AnswerSection[] = [
        { title: 'Summary', content: answer.summary || 'No summary provided.' },
        ...(answer.relevant_facts?.length ? [{ title: 'Relevant Facts', content: answer.relevant_facts.join('\n') }] : []),
        ...(answer.legal_issues?.length ? [{ title: 'Legal Issues', content: answer.legal_issues.join('\n') }] : []),
        ...(answer.applicable_law?.length ? [{ title: 'Applicable Law', content: answer.applicable_law.join('\n') }] : []),
        ...(answer.analysis ? [{ title: 'Analysis', content: answer.analysis }] : []),
        ...(answer.conclusion ? [{ title: 'Conclusion', content: answer.conclusion }] : []),
      ]

      const agentMsg: Message = {
        id: `m${Date.now()}`,
        role: 'agent',
        content: '',
        sections,
        sources: answer.sources?.map((s: any, idx: number) => ({
          id: `src-${Date.now()}-${idx}`,
          type: s.type || 'document',
          title: s.title || s.document_name || 'Source',
          authority: s.authority || 'Document',
          date: s.date || '',
          excerpt: s.url || `Page ${s.page}`,
          citation: s.document_name ? `${s.document_name}, p. ${s.page}` : s.url,
        })) || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMsg])
      setActiveSources(agentMsg.sources || [])
    } catch (err: any) {
      console.error(err)
      clearInterval(stepInterval)
      setThinking(false)
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'agent',
        content: `Error: ${err.message || 'Network request failed. Is the backend running at ' + API_BASE + '?'}`,
        timestamp: new Date()
      }])
    }
  }

  function handleSourceClick(id: string) {
    setHighlightedSource(id)
    const src = activeSources.find(s => s.id === id)
    if (src) setSourceDrawer(src)
    if (!sourcesOpen) setSourcesOpen(true)
  }

  const conflictingSources = activeSources.filter(s => s.conflicting)

  return (
    <div className="flex h-screen bg-parchment overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`flex flex-col shrink-0 border-r border-slate-200 bg-white transition-all duration-200 ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-6 h-6 bg-navy-900 rounded-sm flex items-center justify-center shrink-0">
            <span className="text-brass-300 text-[10px] font-serif font-bold leading-none">L</span>
          </div>
          <span className="text-sm font-semibold text-navy-900 tracking-tight">LexAgent</span>
          <span className="ml-auto text-[10px] font-mono text-brass-500 bg-brass-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
        </div>

        {/* New Research */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { setHasConversation(false); setMessages([]); setActiveSources([]); setActiveSession(`session_${Date.now()}`) }}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 active:bg-navy-950 transition-colors rounded-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Research
          </button>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">Recent Sessions</p>
            <div className="space-y-0.5">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-sm group hover:bg-slate-50 transition-colors ${
                    activeSession === session.id ? 'bg-navy-50' : ''
                  }`}
                >
                  <p className="text-xs font-medium text-navy-800 leading-tight truncate mb-0.5">{session.title}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {session.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">Documents</p>
              <button className="text-[10px] text-brass-500 hover:text-brass-600 font-medium">+ Add</button>
            </div>
            <div className="space-y-0.5">
              {docs.map(doc => <DocUploadCard key={doc.id} doc={doc} />)}
            </div>
          </div>
        </div>

        {/* Account footer */}
        <div className="px-3 py-3 border-t border-slate-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-navy-700 flex items-center justify-center text-[10px] font-semibold text-navy-100">JD</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-navy-800 truncate">J. Douglas, Esq.</p>
            <p className="text-[10px] text-slate-400">Morrison & Foerster LLP</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Center Pane ───────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-sm hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {hasConversation && messages.length > 0 && (
            <h1 className="text-sm font-medium text-navy-800 font-serif truncate">
              {messages.find(m => m.role === 'user')?.content?.slice(0, 60) ?? 'Research Session'}{(messages.find(m => m.role === 'user')?.content?.length ?? 0) > 60 ? '…' : ''}
            </h1>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Removed Scope toggle since Agent auto-routes */}

            <button
              onClick={() => setSourcesOpen(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-medium rounded-sm border transition-colors ${
                sourcesOpen
                  ? 'border-brass-300 bg-brass-50 text-brass-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Sources {activeSources.length > 0 && <span className="font-bold">{activeSources.length}</span>}
            </button>
          </div>
        </header>

        {/* Thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto">
          {!hasConversation ? (
            <EmptyState onQuery={handleQuery} onUpload={handleUpload} />
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="max-w-lg">
                      <div className="bg-navy-900 text-white rounded-sm px-4 py-3 text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <AnswerCard message={msg} onSourceClick={handleSourceClick} />
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' · '}
                        {msg.sources?.length ?? 0} sources retrieved
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking state */}
              {thinking && (
                <div className="w-full">
                  <AgentStepper currentStep={thinkingStep} />
                  <div className="flex gap-2 items-center px-4 py-3 border border-slate-200 rounded-sm bg-white">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">LexAgent is researching…</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query input */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 border border-slate-200 rounded-sm focus-within:border-navy-400 focus-within:ring-1 focus-within:ring-navy-200 transition-all bg-white">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() }
                }}
                placeholder="Ask a legal research question…"
                rows={2}
                className="flex-1 resize-none px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 bg-transparent outline-none leading-relaxed"
              />
              <button
                onClick={() => handleQuery()}
                disabled={!query.trim() || thinking}
                className="mb-2 mr-2 w-8 h-8 rounded-sm bg-navy-900 hover:bg-navy-800 disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center text-white disabled:text-slate-400 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
              Searching: <span className="text-navy-600 font-medium capitalize">{scope}</span>
              {' · '}Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>

      {/* ── Right Sources Panel ───────────────────────────────────── */}
      <aside
        className={`shrink-0 flex flex-col border-l border-slate-200 bg-white transition-all duration-200 overflow-hidden ${
          sourcesOpen ? 'w-[320px]' : 'w-0'
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-navy-800 font-mono uppercase tracking-wider">Sources & Citations</span>
          {activeSources.length > 0 && (
            <span className="ml-1 text-[10px] font-mono text-slate-400">{activeSources.length}</span>
          )}
          {conflictingSources.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {conflictingSources.length} Conflict
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <svg className="w-8 h-8 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-xs text-slate-400">Sources will appear here once you ask a research question.</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {/* Conflict banner */}
              {conflictingSources.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-sm bg-amber-50 border border-amber-200 mb-3">
                  <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Conflicting Authorities Detected</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">Lamps Plus may limit the class arbitration analysis. Review both sources before advising.</p>
                  </div>
                </div>
              )}

              {activeSources.map(src => (
                <SourceCard
                  key={src.id}
                  source={src}
                  highlighted={highlightedSource === src.id}
                  onClick={() => { setHighlightedSource(src.id); setSourceDrawer(src) }}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Source Drawer ─────────────────────────────────────────── */}
      {sourceDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSourceDrawer(null)}>
          <div
            className="w-[480px] max-w-full h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-serif font-semibold text-navy-900 leading-tight mb-1">{sourceDrawer.title}</h3>
                <p className="text-xs text-slate-500">{sourceDrawer.authority} · {sourceDrawer.date}</p>
              </div>
              <button
                onClick={() => setSourceDrawer(null)}
                className="p-1.5 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Citation</p>
                <p className="text-sm font-mono text-brass-700">{sourceDrawer.citation}</p>
              </div>
              <div className="mb-4">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Relevant Excerpt</p>
                <blockquote className="border-l-2 border-brass-300 pl-3 italic text-sm text-slate-700 leading-relaxed font-serif">
                  "{sourceDrawer.excerpt}"
                </blockquote>
              </div>
              {sourceDrawer.conflicting && (
                <div className="flex items-start gap-2 p-3 rounded-sm bg-amber-50 border border-amber-200 mt-4">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-0.5">Conflicting Authority</p>
                    <p className="text-[11px] text-amber-700">This source may conflict with other retrieved authorities. Exercise independent judgment before relying on it.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
              <button className="flex-1 text-xs font-medium text-navy-800 border border-slate-200 px-3 py-2 rounded-sm hover:bg-slate-50 transition-colors">
                View in Document
              </button>
              <button className="flex-1 text-xs font-medium text-white bg-navy-900 hover:bg-navy-800 px-3 py-2 rounded-sm transition-colors">
                Add to Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
