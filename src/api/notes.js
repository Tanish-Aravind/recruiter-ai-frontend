import api, { cachedGet, invalidateCache } from './axios';

export const addNote = (candidateId, content) =>
  api.post(`/api/notes/${candidateId}`, { content }).then((response) => {
    invalidateCache(`/api/notes/${candidateId}`);
    return response;
  });

export const getNotes = (candidateId, config) =>
  cachedGet(`/api/notes/${candidateId}`, config);
