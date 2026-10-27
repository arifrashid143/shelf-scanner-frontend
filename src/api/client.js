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

  const isFormData = options.body instanceof FormData

  const headers = {
    'accept': '*/*',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  // Inventory Endpoints (GET /api/inventory, PUT /api/inventory/{id}, POST /api/inventory)
  getInventory: (params = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.category) query.append('category', params.category)
    if (params.low_stock_only) query.append('low_stock_only', 'true')
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/inventory${qs}`)
  },

  getProductById: (productId) =>
    request(`/inventory/${encodeURIComponent(productId)}`),

  updateProduct: (productId, data) =>
    request(`/inventory/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createProduct: (data) =>
    request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Purchase Orders (GET /api/purchase-orders, POST /api/purchase-orders/draft, PUT /api/purchase-orders/{id}/approve, POST /api/purchase-orders/{id}/cancel)
  getOrders: () => request('/purchase-orders'),

  generateOrder: (data = {}) =>
    request('/purchase-orders/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approveOrder: (poId, data = {}) =>
    request(`/purchase-orders/${encodeURIComponent(poId)}/approve`, {
      method: 'PUT',
      body: JSON.stringify({
        approved_by: data.approved_by || 'Store Admin',
        notes: data.notes || 'Approved via visual shelf scanner reorder agent',
      }),
    }),

  cancelOrder: (poId) =>
    request(`/purchase-orders/${encodeURIComponent(poId)}/cancel`, {
      method: 'POST',
    }),

  // Shelf Scans Endpoints (POST /api/scans, GET /api/scans, GET /api/scans/{scan_id}, GET /api/scans/{scan_id}/detections)
  uploadScan: (fileOrFormData, meta = {}) => {
    let body = fileOrFormData
    if (!(fileOrFormData instanceof FormData)) {
      body = new FormData()
      if (fileOrFormData instanceof Blob || fileOrFormData instanceof File) {
        body.append('file', fileOrFormData, fileOrFormData.name || 'shelf_photo.png')
      }
      body.append('store_id', meta.store_id || 'store_main')
      body.append('shelf_id', meta.shelf_id || 'Aisle 3, Shelf B')
      if (meta.notes) body.append('notes', meta.notes)
      body.append('sync_mode', meta.sync_mode !== undefined ? String(meta.sync_mode) : 'true')
    }
    return request('/scans', {
      method: 'POST',
      body,
    })
  },

  getScans: (params = {}) => {
    const query = new URLSearchParams()
    if (params.skip !== undefined) query.append('skip', params.skip)
    if (params.limit !== undefined) query.append('limit', params.limit)
    if (params.store_id) query.append('store_id', params.store_id)
    if (params.shelf_id) query.append('shelf_id', params.shelf_id)
    const qs = query.toString() ? `?${query.toString()}` : ''

    return request(`/scans${qs}`).catch((err) => {
      console.warn('Scans fetch fallback:', err.message)
      return { recentScans: [] }
    })
  },

  getScanById: (scanId) =>
    request(`/scans/${encodeURIComponent(scanId)}`),

  getScanDetections: (scanId) =>
    request(`/scans/${encodeURIComponent(scanId)}/detections`),

  // Legacy alias for compatibility
  analyzeScan: (fileOrShelf, meta = {}) => {
    if (typeof fileOrShelf === 'string') {
      return api.uploadScan(null, { shelf_id: fileOrShelf, ...meta })
    }
    return api.uploadScan(fileOrShelf, meta)
  },
}
