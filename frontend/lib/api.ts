/**
 * SafetyOS Typed API Client
 * Centralized HTTP client with environment variable support
 */

const API_BASE = typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_API_URL
  ? (window as any).NEXT_PUBLIC_API_URL
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const API_TIMEOUT = 8000; // 8 seconds

/**
 * Make a GET request to the API
 */
export async function apiGet<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API GET failed: ${path}`, error);
    throw error;
  }
}

/**
 * Make a POST request to the API
 */
export async function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API POST failed: ${path}`, error);
    throw error;
  }
}

/**
 * Make a PUT request to the API
 */
export async function apiPut<T = unknown>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API PUT failed: ${path}`, error);
    throw error;
  }
}

/**
 * Make a DELETE request to the API
 */
export async function apiDelete<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    
    // Some DELETE endpoints don't return JSON
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    console.error(`API DELETE failed: ${path}`, error);
    throw error;
  }
}

/**
 * Typed API client object
 */
export const api = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  
  /**
   * Get base URL for reference
   */
  getBaseUrl: () => API_BASE,
};

export default api;
