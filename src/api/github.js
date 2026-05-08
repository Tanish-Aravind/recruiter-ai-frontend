import api, { cachedGet, invalidateCache } from './axios';

export const analyzeGithub = async (candidateId, github_url) => {
  const response = await api.post(`/api/github/analyze/${candidateId}`, { github_url });
  invalidateCache(`/api/github/${candidateId}`);
  return response;
};

export const getGithubData = (candidateId, config) =>
  cachedGet(`/api/github/${candidateId}`, config);
