import api, { cachedGet, invalidateCache } from './axios';

export const getJobs = (config) => cachedGet('/api/jobs', config);

export const createJob = async (data) => {
  const response = await api.post('/api/jobs', data);
  invalidateCache('/api/jobs');
  return response;
};

export const deleteJob = async (id) => {
  const response = await api.delete(`/api/jobs/${id}`);
  invalidateCache('/api/jobs');
  return response;
};
