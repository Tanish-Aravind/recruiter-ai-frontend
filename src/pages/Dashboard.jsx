import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getJobs, createJob, deleteJob } from '../api/jobs';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchJobs = useCallback(async (options) => {
    try {
      const res = await getJobs(options);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async () => {
    if (!title.trim()) return toast.error('Title is required');
    setCreating(true);
    try {
      const res = await createJob({ title: title.trim(), description: description.trim() });
      const createdJob = res.data;

      if (createdJob?.id) {
        setJobs((current) => [createdJob, ...current]);
      } else {
        await fetchJobs({ force: true });
      }

      toast.success('Job created');
      setTitle('');
      setDescription('');
      setShowForm(false);
    } catch {
      toast.error('Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteJob(id);
      setJobs((current) => current.filter((job) => job.id !== id));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="page-shell">
      <Navbar />

      <div className="page-container" style={{ maxWidth: '980px' }}>
        <div className="animate-fade-up stagger-1" style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '36px',
          flexWrap: 'wrap',
        }}>
          <div>
            <p className="ui-eyebrow" style={{ marginBottom: '10px' }}>
              Dashboard
            </p>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-1.2px',
              lineHeight: 1.05,
            }}>
              Job Postings
            </h1>
            <p style={{
              marginTop: '12px',
              fontSize: '17px',
              color: 'var(--text-secondary)',
              maxWidth: '42ch',
            }}>
              Create roles, review applicants, and keep hiring work organized in one easy-to-scan space.
            </p>
          </div>

          <button
            onClick={() => setShowForm((current) => !current)}
            className={`ui-button ${showForm ? 'ui-button-secondary' : 'ui-button-primary'}`}
            style={{
              minWidth: '150px',
            }}
          >
            {showForm ? 'Cancel' : '+ New Job'}
          </button>
        </div>

        {showForm && (
          <div className="surface-card animate-fade-up" style={{
            borderColor: 'var(--border-accent)',
            padding: '28px',
            marginBottom: '28px',
          }}>
            <p style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}>
              Add a new role
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title"
              className="ui-input"
              style={inputStyle}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job description (optional)"
              rows={3}
              className="ui-input"
              style={{ ...inputStyle, resize: 'vertical', marginTop: '14px', marginBottom: '18px', minHeight: '120px' }}
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="ui-button ui-button-primary"
            >
              {creating ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={spinnerStyle} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="animate-fade-up stagger-2" style={{
            textAlign: 'center',
            padding: '80px 0',
            color: 'var(--text-muted)',
          }}>
            <p style={{ fontSize: '16px', fontFamily: 'DM Mono, monospace' }}>
              No job postings yet
            </p>
            <p style={{ fontSize: '16px', marginTop: '10px', color: 'var(--text-secondary)' }}>
              Create your first job to start reviewing candidates
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map((job, i) => (
              <div
                key={job.id}
                className={`animate-fade-up stagger-${Math.min(i + 2, 5)}`}
                onClick={() => navigate(`/jobs/${job.id}`)}
                style={jobCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(24, 33, 51, 0.96), rgba(18, 24, 38, 0.96))';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 14px 34px var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(18, 24, 38, 0.96), rgba(14, 19, 31, 0.96))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}>
                    {job.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    {job.created_at
                      ? new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No date'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'DM Mono, monospace',
                  }}>
                    {'View candidates ->'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, job.id)}
                    className="ui-button ui-button-secondary"
                    style={secondaryButtonStyle}
                  >
                    Delete
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

const inputStyle = {
  width: '100%',
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

const jobCardStyle = {
  padding: '24px 26px',
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

const secondaryButtonStyle = {
  minHeight: '40px',
  padding: '0 14px',
  fontSize: '14px',
};
