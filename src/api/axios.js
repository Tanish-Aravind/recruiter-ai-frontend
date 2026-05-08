import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const DEFAULT_CACHE_TTL = 30_000;
const responseCache = new Map();
const inflightRequests = new Map();

const buildCacheKey = (url, config = {}) => {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${url}?${params}`;
};

export const cachedGet = async (url, config = {}) => {
  const { cache = true, ttl = DEFAULT_CACHE_TTL, force = false, ...requestConfig } = config;

  if (!cache) {
    return api.get(url, requestConfig);
  }

  const cacheKey = buildCacheKey(url, requestConfig);
  const now = Date.now();
  const cachedEntry = responseCache.get(cacheKey);

  if (!force && cachedEntry && now - cachedEntry.timestamp < ttl) {
    return Promise.resolve(cachedEntry.response);
  }

  const inflightRequest = inflightRequests.get(cacheKey);
  if (!force && inflightRequest) {
    return inflightRequest;
  }

  const request = api.get(url, requestConfig)
    .then((response) => {
      responseCache.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);
  return request;
};

export const invalidateCache = (matcher) => {
  for (const key of responseCache.keys()) {
    if (typeof matcher === 'string' ? key.startsWith(matcher) : matcher(key)) {
      responseCache.delete(key);
    }
  }
};

export default api;
