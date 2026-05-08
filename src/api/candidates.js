import api, { cachedGet, invalidateCache } from './axios';

export const uploadResume = (formData) =>
  api.post('/api/candidates/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getCandidates = (jobId, config) =>
  cachedGet('/api/candidates', { ...config, params: { job_id: jobId } });

export const getCandidate = (id, config) => cachedGet(`/api/candidates/${id}`, config);

export const updateStatus = async (id, status) => {
  const response = await api.patch(`/api/candidates/${id}/status`, { status });
  invalidateCache((key) => key.startsWith(`/api/candidates/${id}`) || key.startsWith('/api/candidates?'));
  return response;
};

export const deleteCandidate = async (id) => {
  const response = await api.delete(`/api/candidates/${id}`);
  invalidateCache((key) => key.startsWith(`/api/candidates/${id}`) || key.startsWith('/api/candidates?'));
  return response;
};

export const uploadBatch = async (formData) => {
  const response = await api.post('/api/candidates/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  invalidateCache('/api/candidates?');
  return response;
};

export const exportCandidates = (jobId) =>
  api.get('/api/candidates/export', {
    params: { job_id: jobId },
    responseType: 'blob',
  });
