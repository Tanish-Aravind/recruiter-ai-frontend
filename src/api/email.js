import api from './axios';

export const getEmailDraft = (candidateId, type) =>
  api.get(`/api/email/draft/${candidateId}`, { params: { type } });

export const sendEmail = (data) =>
  api.post('/api/email/send', data);