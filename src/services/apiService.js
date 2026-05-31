const API_BASE = '/api';

class APIService {
  constructor() {
    this.baseURL = API_BASE;
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    let lastError;
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: response.statusText }));
          throw new APIError(error.message || 'Request failed', response.status, error);
        }

        return response.json();
      } catch (error) {
        lastError = error;
        if (error instanceof APIError) throw error;
        
        if (i < this.retryCount - 1) {
          await this.delay(this.retryDelay * (i + 1));
        }
      }
    }

    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }

  patch(endpoint, data) {
    return this.request(endpoint, { method: 'PATCH', body: data });
  }

  delete(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'DELETE' });
  }
}

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export const api = new APIService();
export { APIError };
export default api;