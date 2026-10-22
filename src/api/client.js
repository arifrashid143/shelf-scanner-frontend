const API_BASE = '/api'

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
    throw new ApiError(
      responseData?.error || `Request failed with status ${response.status}`,
      response.status,
      responseData
    )
  }

  return responseData
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  // Inventory
  getInventory: () => request('/inventory'),

  // Admin only inventory actions
  updateInventory: (data) =>
    request('/inventory/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addInventoryProduct: (data) =>
    request('/inventory/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Purchase Orders
  getOrders: () => request('/orders'),

  generateOrder: (data = {}) =>
    request('/orders/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin only PO approval/rejection actions
  approveOrder: (id) =>
    request(`/orders/${id}/approve`, {
      method: 'POST',
    }),

  rejectOrder: (id) =>
    request(`/orders/${id}/reject`, {
      method: 'POST',
    }),

  // Scans
  getScans: () => request('/scans'),

  analyzeScan: (shelfName) =>
    request('/scans/analyze', {
      method: 'POST',
      body: JSON.stringify({ shelfName }),
    }),
}

