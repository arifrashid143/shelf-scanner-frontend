const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-vs-scanner-be.aiiotgeeks.tech/api'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('shelf_scanner_token')

  const headers = {
    'accept': '*/*',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  let responseData
  try {
    responseData = await response.json()
  } catch {
    responseData = null
  }

  if (!response.ok) {
    const errorMsg =
      responseData?.detail ||
      responseData?.message ||
      responseData?.error ||
      `Request failed with status ${response.status}`
    throw new ApiError(errorMsg, response.status, responseData)
  }

  return responseData
}

export const api = {
  // Auth API Endpoints (Connected to https://ai-vs-scanner-be.aiiotgeeks.tech)
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),

  signup: (data) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    localStorage.removeItem('shelf_scanner_token')
    return Promise.resolve({ success: true })
  },

  // Inventory
  getInventory: () => request('/inventory'),

  // Purchase Orders
  getOrders: () => request('/purchase-orders'),

  generateOrder: (data = {}) =>
    request('/purchase-orders/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveOrder: (poId) =>
    request(`/purchase-orders/${poId}/approve`, {
      method: 'POST',
    }),

  cancelOrder: (poId) =>
    request(`/purchase-orders/${poId}/cancel`, {
      method: 'POST',
    }),

  // Scans
  getScans: () =>
    request('/scans').catch((err) => {
      console.warn('Scans fetch fallback:', err.message)
      return { recentScans: [] }
    }),
}
