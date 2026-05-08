import { useState } from 'react';
import toast from 'react-hot-toast';
import { getEmailDraft, sendEmail } from '../api/email';

const EMAIL_TYPES = [
  { value: 'interview', label: '📅 Interview Invite', color: '#6366f1' },
  { value: 'rejection', label: '❌ Rejection', color: '#ef4444' },
  { value: 'offer', label: '🎉 Job Offer', color: '#22c55e' },
];

export default function EmailModal({ candidate, onClose }) {
  const [step, setStep] = useState('type');
  const [selectedType, setSelectedType] = useState('interview');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerateDraft = async () => {
    setLoading(true);
    try {
      const res = await getEmailDraft(candidate.id, selectedType);
      setDraft(res.data);
      setStep('edit');
    } catch {
      toast.error('Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await sendEmail({
        to: draft.to,
        subject: draft.subject,
        body: draft.body,
      });
      toast.success('Email sent successfully!');
      onClose();
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  };

  const modal = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    padding: '32px',
    position: 'relative',
    animation: 'fadeUp 0.3s ease forwards',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    marginBottom: '12px',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <p style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              color: 'var(--accent)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}>Email</p>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}>
              {step === 'type' ? 'Choose email type' : 'Review & send'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
          >×</button>
        </div>

        {/* To field */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
          }}>TO</span>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            {candidate.email}
          </span>
        </div>

        {/* Step 1 — Type selection */}
        {step === 'type' && (
          <>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '24px',
            }}>
              {EMAIL_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  style={{
                    padding: '14px 18px',
                    background: selectedType === type.value
                      ? `${type.color}15`
                      : 'var(--bg-elevated)',
                    border: '1px solid',
                    borderColor: selectedType === type.value
                      ? type.color
                      : 'var(--border)',
                    borderRadius: '10px',
                    color: selectedType === type.value
                      ? type.color
                      : 'var(--text-secondary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateDraft}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {loading ? 'Generating draft...' : '✨ Generate AI Draft'}
            </button>
          </>
        )}

        {/* Step 2 — Edit & send */}
        {step === 'edit' && draft && (
          <>
            <input
              value={draft.subject}
              onChange={e => setDraft({ ...draft, subject: e.target.value })}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              placeholder="Subject"
            />

            <textarea
              value={draft.body}
              onChange={e => setDraft({ ...draft, body: e.target.value })}
              rows={8}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: '1.6',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep('type')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                ← Back
              </button>

              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {sending ? 'Sending...' : '📨 Send Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}