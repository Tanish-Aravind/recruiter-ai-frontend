import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { getCandidates, uploadResume, uploadBatch, deleteCandidate, exportCandidates } from '../api/candidates';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const batchRef = useRef();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [batchResults, setBatchResults] = useState([]);
  const [showBatch, setShowBatch] = useState(false);

  const fetchCandidates = useCallback(async (options) => {
    setLoading(true);
    try {
      const res = await getCandidates(jobId, options);
      setCandidates(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCandidates();
  }, [fetchCandidates]);

  const handleSingleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_id', jobId);
    setUploading(true);
    const toastId = toast.loading('Analyzing resume...');

    try {
      await uploadResume(formData);
      toast.success('Resume analyzed!', { id: toastId });
      await fetchCandidates({ force: true });
    } catch {
      toast.error('Upload failed', { id: toastId });
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const pending = files.map((file) => ({
      filename: file.name,
      status: 'processing',
    }));

    setBatchResults(pending);
    setShowBatch(true);
    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append('resumes', file));
    formData.append('job_id', jobId);

    try {
      const res = await uploadBatch(formData);
      setBatchResults(res.data.results);
      toast.success(res.data.message);
      await fetchCandidates({ force: true });
    } catch {
      toast.error('Batch upload failed');
      setBatchResults(files.map((file) => ({
        filename: file.name,
        status: 'failed',
        error: 'Upload error',
      })));
    } finally {
      setUploading(false);
      batchRef.current.value = '';
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteCandidate(id);
      setCandidates((current) => current.filter((candidate) => candidate.id !== id));
      toast.success('Candidate removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const statuses = ['all', 'uploaded', 'reviewed', 'shortlisted', 'interview', 'rejected'];
  const statusCounts = useMemo(
    () => candidates.reduce((counts, candidate) => {
      counts[candidate.status] = (counts[candidate.status] || 0) + 1;
      return counts;
    }, {}),
    [candidates],
  );
  const filtered = useMemo(
    () => (filter === 'all' ? candidates : candidates.filter((candidate) => candidate.status === filter)),
    [candidates, filter],
  );

  const statusColor = {
    success: 'var(--success)',
    failed: 'var(--danger)',
    processing: 'var(--warning)',
  };

  const statusIcon = {
    success: 'OK',
    failed: 'X',
    processing: '...',
  };

  const handleExport = async () => {
    try {
      const res = await exportCandidates(jobId);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates-job-${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="page-shell">
      <Navbar />

      <div className="page-container" style={{ maxWidth: '1040px' }}>
        <div className="animate-fade-up stagger-1" style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={backLinkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {'<- Dashboard'}
          </button>

          <div style={headerRowStyle}>
            <div>
              <p className="ui-eyebrow" style={{ marginBottom: '10px' }}>Candidates</p>
              <h1 style={pageTitleStyle}>
                {candidates.length} Applicant{candidates.length !== 1 ? 's' : ''}
              </h1>
              <p style={pageSubtitleStyle}>
                Upload resumes, filter by stage, and keep your shortlist clear.
              </p>
            </div>

            <div style={actionRowStyle}>
              <input type="file" accept=".pdf,.docx" ref={fileRef} onChange={handleSingleUpload} style={{ display: 'none' }} />
              <input type="file" accept=".pdf,.docx" ref={batchRef} onChange={handleBatchUpload} multiple style={{ display: 'none' }} />

              <button
                onClick={() => batchRef.current.click()}
                disabled={uploading}
                className="ui-button ui-button-secondary"
              >
                Batch Upload
              </button>

              <button
                onClick={handleExport}
                disabled={candidates.length === 0}
                style={{
                  padding: '10px 18px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '9px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: candidates.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: candidates.length === 0 ? 0.4 : 1,
                  transition: 'all 0.2s',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => {
                  if (candidates.length > 0) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                ↓ Export CSV
              </button>

              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="ui-button ui-button-primary"
              >
                {uploading ? 'Processing...' : '+ Upload Resume'}
              </button>
            </div>
          </div>
        </div>

        {showBatch && batchResults.length > 0 && (
          <div className="surface-card animate-fade-up" style={{ padding: '24px 26px', marginBottom: '26px' }}>
            <div style={batchHeaderStyle}>
              <p style={batchTitleStyle}>
                Batch upload - {batchResults.length} file{batchResults.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => setShowBatch(false)} style={closeButtonStyle}>x</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batchResults.map((result, index) => (
                <div key={index} style={batchRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        ...batchIconStyle,
                        background: `${statusColor[result.status]}18`,
                        color: statusColor[result.status],
                        animation: result.status === 'processing' ? 'spin 1s linear infinite' : 'none',
                      }}
                    >
                      {statusIcon[result.status]}
                    </span>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {result.filename}
                      </p>
                      {result.name && (
                        <p style={batchMetaStyle}>
                          {result.name} - {result.email}
                        </p>
                      )}
                      {result.error && (
                        <p style={{ fontSize: '13px', color: 'var(--danger)' }}>
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ ...batchStatusStyle, color: statusColor[result.status] }}>
                    {result.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={batchSummaryStyle}>
              <span style={{ color: 'var(--success)' }}>
                Success: {batchResults.filter((result) => result.status === 'success').length}
              </span>
              <span style={{ color: 'var(--danger)' }}>
                Failed: {batchResults.filter((result) => result.status === 'failed').length}
              </span>
            </div>
          </div>
        )}

        <div className="animate-fade-up stagger-2" style={filterRowStyle}>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...filterButtonStyle,
                borderColor: filter === status ? 'var(--border-accent)' : 'var(--border)',
                background: filter === status ? 'var(--accent-glow)' : 'transparent',
                color: filter === status ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {status}
              {status !== 'all' && (
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                  {statusCounts[status] || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={spinnerStyle} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyStateStyle}>
            No candidates {filter !== 'all' ? `with status "${filter}"` : 'yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filtered.map((candidate, index) => (
              <div
                key={candidate.id}
                className={`animate-fade-up stagger-${Math.min(index + 3, 5)}`}
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                style={candidateCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 14px 30px var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={avatarStyle}>
                    {candidate.name ? candidate.name[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {candidate.name || 'Unknown'}
                    </p>
                    <p style={candidateMetaStyle}>
                      {candidate.email || '-'} {candidate.phone ? `| ${candidate.phone}` : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {candidate.match_score > 0 && (
                    <span
                      style={{
                        fontSize: '13px',
                        fontFamily: 'DM Mono, monospace',
                        fontWeight: '600',
                        color:
                          candidate.match_score >= 70
                            ? 'var(--success)'
                            : candidate.match_score >= 40
                              ? 'var(--warning)'
                              : 'var(--danger)',
                      }}
                    >
                      {candidate.match_score}% match
                    </span>
                  )}
                  <StatusBadge status={candidate.status} />
                  <button
                    onClick={(e) => handleDelete(e, candidate.id)}
                    className="ui-button ui-button-secondary"
                    style={{ minHeight: '38px', padding: '0 14px', fontSize: '14px' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pageTitleStyle = {
  fontSize: '40px',
  fontWeight: '800',
  letterSpacing: '-1.2px',
  lineHeight: 1.05,
};

const pageSubtitleStyle = {
  marginTop: '12px',
  fontSize: '17px',
  color: 'var(--text-secondary)',
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '20px',
  flexWrap: 'wrap',
};

const actionRowStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const backLinkStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'DM Mono, monospace',
  marginBottom: '18px',
  padding: 0,
  transition: 'color 0.2s',
};

const batchHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

const batchTitleStyle = {
  fontSize: '16px',
  fontWeight: '700',
  fontFamily: 'DM Mono, monospace',
  color: 'var(--text-primary)',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '22px',
  lineHeight: 1,
};

const batchRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  background: 'var(--bg-elevated)',
  borderRadius: '14px',
  border: '1px solid var(--border)',
  gap: '14px',
  flexWrap: 'wrap',
};

const batchIconStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: '700',
  flexShrink: 0,
};

const batchMetaStyle = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  fontFamily: 'DM Mono, monospace',
};

const batchStatusStyle = {
  fontSize: '12px',
  fontFamily: 'DM Mono, monospace',
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
};

const batchSummaryStyle = {
  marginTop: '16px',
  display: 'flex',
  gap: '16px',
  fontSize: '13px',
  fontFamily: 'DM Mono, monospace',
  flexWrap: 'wrap',
};

const filterRowStyle = {
  display: 'flex',
  gap: '8px',
  marginBottom: '26px',
  flexWrap: 'wrap',
};

const filterButtonStyle = {
  minHeight: '40px',
  padding: '0 16px',
  borderRadius: '999px',
  border: '1px solid',
  fontSize: '13px',
  fontFamily: 'DM Mono, monospace',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textTransform: 'capitalize',
};

const spinnerStyle = {
  width: '32px',
  height: '32px',
  border: '2px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
  margin: '0 auto',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '80px 0',
  color: 'var(--text-muted)',
  fontFamily: 'DM Mono, monospace',
  fontSize: '15px',
};

const candidateCardStyle = {
  padding: '22px 24px',
  background: 'linear-gradient(180deg, rgba(18, 24, 38, 0.96), rgba(14, 19, 31, 0.96))',
  border: '1px solid var(--border)',
  borderRadius: '18px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
  boxShadow: 'var(--shadow-card)',
};

const avatarStyle = {
  width: '46px',
  height: '46px',
  borderRadius: '50%',
  background: 'var(--bg-hover)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: '700',
  color: 'var(--accent)',
  fontFamily: 'DM Mono, monospace',
  flexShrink: 0,
};

const candidateMetaStyle = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  fontFamily: 'DM Mono, monospace',
};
