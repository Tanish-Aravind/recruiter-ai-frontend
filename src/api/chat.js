import api, { cachedGet, invalidateCache } from './axios';

export const sendMessage = (candidateId, question) =>
  api.post(`/api/chat/${candidateId}`, { question }).then((response) => {
    invalidateCache(`/api/chat/${candidateId}`);
    return response;
  });

export const getChatHistory = (candidateId, config) =>
  cachedGet(`/api/chat/${candidateId}`, config);
