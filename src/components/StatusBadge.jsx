const statusConfig = {
  uploaded:    { label: 'Uploaded',    color: '#8888aa', bg: '#8888aa18' },
  reviewed:    { label: 'Reviewed',    color: '#38bdf8', bg: '#38bdf818' },
  shortlisted: { label: 'Shortlisted', color: '#22c55e', bg: '#22c55e18' },
  rejected:    { label: 'Rejected',    color: '#ef4444', bg: '#ef444418' },
  interview:   { label: 'Interview',   color: '#f59e0b', bg: '#f59e0b18' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.uploaded;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: '34px',
      padding: '0 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: '700',
      fontFamily: 'DM Mono, monospace',
      letterSpacing: '0.5px',
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.color}33`,
      textTransform: 'uppercase',
    }}>
      {config.label}
    </span>
  );
}
