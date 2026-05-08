import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import EmailModal from '../components/EmailModal';
import { getCandidate, updateStatus } from '../api/candidates';
import { analyzeGithub, getGithubData } from '../api/github';
import { sendMessage, getChatHistory } from '../api/chat';
import { addNote, getNotes } from '../api/notes';

const TABS = ['Summary', 'Q&A', 'Notes'];

const STATUSES = ['uploaded', 'reviewed', 'shortlisted', 'interview', 'rejected'];

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef();

  const [candidate, setCandidate] = useState(null);
  const [github, setGithub] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState('Summary');
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [githubUrl, setGithubUrl] = useState('');
  const [analyzingGithub, setAnalyzingGithub] = useState(false);

  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const loadedTabsRef = useRef({ qa: false, notes: false });

  const fetchCandidate = useCallback(async (options) => {
    setLoading(true);
    try {
      const res = await getCandidate(id, options);
      setCandidate(res.data);
      setGithubUrl(res.data.github_url || '');
    } catch {
      toast.error('Failed to load candidate');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGithub = useCallback(async (options) => {
    try {
      const res = await getGithubData(id, options);
      setGithub(res.data);
    } catch {
      setGithub(null);
    }
  }, [id]);

  const fetchChat = useCallback(async (options) => {
    try {
      const res = await getChatHistory(id, options);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      return;
    }
  }, [id]);

  const fetchNotes = useCallback(async (options) => {
    try {
      const res = await getNotes(id, options);
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      return;
    }
  }, [id]);

  useEffect(() => {
    loadedTabsRef.current = { qa: false, notes: false };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCandidate();
  }, [fetchCandidate]);

  useEffect(() => {
    if (tab === 'Q&A' && !loadedTabsRef.current.qa) {
      loadedTabsRef.current.qa = true;
      void Promise.all([fetchChat(), fetchGithub()]);
    }

    if (tab === 'Notes' && !loadedTabsRef.current.notes) {
      loadedTabsRef.current.notes = true;
      void fetchNotes();
    }
  }, [tab, fetchChat, fetchGithub, fetchNotes]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGithubAnalyze = async () => {
    if (!githubUrl.trim()) return toast.error('Enter a GitHub URL');
    setAnalyzingGithub(true);
    const toastId = toast.loading('Fetching GitHub data...');
    try {
      await analyzeGithub(id, githubUrl);
      toast.success('GitHub analyzed!', { id: toastId });
      await fetchGithub({ force: true });
    } catch {
      toast.error('GitHub analysis failed', { id: toastId });
    } finally {
      setAnalyzingGithub(false);
    }
  };

  const handleSendMessage = async () => {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    try {
      const res = await sendMessage(id, q);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch {
      toast.error('Failed to get answer');
    } finally {
      setSending(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const content = noteText.trim();
    setSavingNote(true);
    try {
      const res = await addNote(id, content);
      setNoteText('');
      const createdNote = res.data;

      if (createdNote?.id) {
        setNotes((current) => [createdNote, ...current]);
      } else {
        await fetchNotes({ force: true });
      }

      loadedTabsRef.current.notes = true;
      toast.success('Note saved');
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus(id, status);
      setCandidate(prev => ({ ...prev, status }));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const githubLanguages = github?.languages_json
    ? Object.entries(
        typeof github.languages_json === 'string'
          ? JSON.parse(github.languages_json)
          : github.languages_json
      ).sort(([, a], [, b]) => b - a)
    : [];

  const githubRepos = github?.repos_json
    ? (
        typeof github.repos_json === 'string'
          ? JSON.parse(github.repos_json)
          : github.repos_json
      )
    : [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />

      {showEmailModal && (
        <EmailModal
          candidate={candidate}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            marginBottom: '24px',
            padding: 0,
            transition: 'color 0.2s',
            background: 'none',
            border: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Back
        </button>

        <div
          className="animate-fade-up stagger-1"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '600',
                  color: 'var(--accent)',
                  fontFamily: 'DM Mono, monospace',
                  flexShrink: 0,
                }}
              >
                {candidate.name ? candidate.name[0].toUpperCase() : '?'}
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    letterSpacing: '-0.3px',
                    marginBottom: '4px',
                  }}
                >
                  {candidate.name || 'Unknown'}
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                  }}
                >
                  {candidate.email} {candidate.phone ? `· ${candidate.phone}` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={candidate.status}
                onChange={e => handleStatusChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                }}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s} style={{ background: 'var(--bg-elevated)' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowEmailModal(true)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Send Email
              </button>

              {candidate.resume_url && (
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  View Resume
                </a>
              )}
            </div>
          </div>
        </div>

        <div
          className="animate-fade-up stagger-2"
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '4px',
          }}
        >
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '9px',
                borderRadius: '7px',
                border: 'none',
                background: tab === t ? 'var(--bg-elevated)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: tab === t ? '500' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Q&A' && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              height: '720px',
            }}
          >
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    color: 'var(--accent)',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}
                >
                  GitHub Context
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Analyze the candidate&apos;s GitHub here so the Q&A can use that context directly.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '10px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'DM Sans, sans-serif',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  onKeyDown={e => e.key === 'Enter' && handleGithubAnalyze()}
                />
                <button
                  onClick={handleGithubAnalyze}
                  disabled={analyzingGithub}
                  style={{
                    padding: '10px 18px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: analyzingGithub ? 'not-allowed' : 'pointer',
                    opacity: analyzingGithub ? 0.7 : 1,
                    fontFamily: 'DM Sans, sans-serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {analyzingGithub ? 'Analyzing...' : 'Analyze GitHub'}
                </button>
              </div>

              {github ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    padding: '16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                  }}
                >
                  {githubLanguages.length > 0 && (
                    <div>
                      <p
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          marginBottom: '10px',
                        }}
                      >
                        Top Languages
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {githubLanguages.map(([lang]) => (
                          <span
                            key={lang}
                            style={{
                              padding: '4px 12px',
                              background: 'var(--accent-glow)',
                              border: '1px solid var(--border-accent)',
                              borderRadius: '20px',
                              fontSize: '12px',
                              color: 'var(--accent)',
                              fontFamily: 'DM Mono, monospace',
                            }}
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {githubRepos.length > 0 && (
                    <div>
                      <p
                        style={{
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          letterSpacing: '1.2px',
                          textTransform: 'uppercase',
                          marginBottom: '10px',
                        }}
                      >
                        Highlighted Repositories
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {githubRepos.map(repo => (
                          <a
                            key={repo.name}
                            href={repo.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '14px 16px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                              display: 'block',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--accent)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px',
                                gap: '10px',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {repo.name}
                              </p>
                              {repo.language && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'DM Mono, monospace',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {repo.language}
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  lineHeight: '1.5',
                                }}
                              >
                                {repo.description}
                              </p>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--bg-elevated)',
                    border: '1px dashed var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '12px',
                  }}
                >
                  No GitHub data yet. Add a profile URL above to include GitHub context in the candidate Q&A.
                </div>
              )}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    margin: 'auto',
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '13px',
                  }}
                >
                  <p style={{ marginBottom: '8px' }}>Ask anything about this candidate</p>
                  <p style={{ fontSize: '12px', opacity: 0.7 }}>
                    &quot;What projects have they built?&quot; · &quot;Do they know Docker?&quot; · &quot;What&apos;s their strongest skill?&quot;
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user'
                          ? '12px 12px 4px 12px'
                          : '12px 12px 12px 4px',
                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-elevated)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px 12px 12px 4px',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about this candidate..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !question.trim()}
                style={{
                  padding: '10px 18px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending || !question.trim() ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {tab === 'Notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note about this candidate..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: '12px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !noteText.trim()}
                style={{
                  padding: '9px 20px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: savingNote ? 'not-allowed' : 'pointer',
                  opacity: savingNote || !noteText.trim() ? 0.5 : 1,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'opacity 0.2s',
                }}
              >
                {savingNote ? 'Saving...' : 'Add Note'}
              </button>
            </div>

            {notes.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '13px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}
              >
                No notes yet
              </div>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      lineHeight: '1.6',
                      marginBottom: '8px',
                    }}
                  >
                    {note.content}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'DM Mono, monospace',
                    }}
                  >
                    {new Date(note.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
