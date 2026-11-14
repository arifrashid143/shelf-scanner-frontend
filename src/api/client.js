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
    if (params.limit !== undefined) query.append('limit', params.limit)
    if (params.skip !== undefined) query.append('skip', params.skip)
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

  deleteProduct: (productId) =>
    request(`/inventory/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    }),

  getProductHistory: (productId) =>
    request(`/inventory/${encodeURIComponent(productId)}/history`),

  restoreProduct: (productId) =>
    request(`/inventory/${encodeURIComponent(productId)}/restore`, {
      method: 'PUT',
    }),

  // Purchase Orders (GET /api/purchase-orders, POST /api/purchase-orders/draft, GET /api/purchase-orders/{id}, PUT /api/purchase-orders/{id}/approve, POST /api/purchase-orders/{id}/cancel)
  getOrders: () => request('/purchase-orders'),

  getOrderById: (poId) =>
    request(`/purchase-orders/${encodeURIComponent(poId)}`),

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
      if (meta.store_id) body.append('store_id', meta.store_id)
      if (meta.shelf_id) body.append('shelf_id', meta.shelf_id)
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

    return request(`/scans${qs}`)
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

  // ==================== TENANT ADMINISTRATION (COMPANY WORKSPACE) ====================
  // GET /api/tenant/users - List Company Users
  getTenantUsers: () => request('/tenant/users'),

  // POST /api/tenant/users - Create Company User
  createTenantUser: (data) =>
    request('/tenant/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT /api/tenant/users/{user_id} - Update Company User
  updateTenantUser: (userId, data) =>
    request(`/tenant/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // DELETE /api/tenant/users/{user_id} - Deactivate Company User
  deactivateTenantUser: (userId) =>
    request(`/tenant/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }),

  // GET /api/tenant/stores - List Company Stores
  getTenantStores: () => request('/tenant/stores'),

  // POST /api/tenant/stores - Create Company Store
  createTenantStore: (data) =>
    request('/tenant/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ==================== SUPERADMIN (PLATFORM MANAGEMENT) ====================
  // GET /api/superadmin/tenants - List Tenants
  getSuperadminTenants: () => request('/superadmin/tenants'),

  // POST /api/superadmin/tenants - Create Tenant & Provision Admin
  createSuperadminTenant: (data) =>
    request('/superadmin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // PUT /api/superadmin/tenants/{tenant_id}/status - Update Tenant Status
  updateSuperadminTenantStatus: (tenantId, data) =>
    request(`/superadmin/tenants/${encodeURIComponent(tenantId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // GET /api/superadmin/analytics - Get Superadmin Analytics
  getSuperadminAnalytics: () => request('/superadmin/analytics'),

  // ==================== TENANT SHELVES & HIERARCHY ====================
  // GET /api/tenant/shelves - List Company Shelves
  getTenantShelves: (params = {}) => {
    const query = new URLSearchParams()
    if (params.store_id) query.append('store_id', params.store_id)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/tenant/shelves${qs}`)
  },

  // POST /api/tenant/shelves - Create Shelf
  createTenantShelf: (data) =>
    request('/tenant/shelves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // GET /api/tenant/stores/{store_id}/shelves - List Store Shelves
  getStoreShelves: (storeId) =>
    request(`/tenant/stores/${encodeURIComponent(storeId)}/shelves`),

  // POST /api/tenant/stores/{store_id}/shelves - Create Store Shelf
  createStoreShelf: (storeId, data) =>
    request(`/tenant/stores/${encodeURIComponent(storeId)}/shelves`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // GET /api/tenant/shelves/{shelf_id} - Get Shelf Details
  getShelfById: (shelfId) =>
    request(`/tenant/shelves/${encodeURIComponent(shelfId)}`),

  // PUT /api/tenant/shelves/{shelf_id} - Update Shelf
  updateShelf: (shelfId, data) =>
    request(`/tenant/shelves/${encodeURIComponent(shelfId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // DELETE /api/tenant/shelves/{shelf_id} - Deactivate Shelf
  deleteShelf: (shelfId) =>
    request(`/tenant/shelves/${encodeURIComponent(shelfId)}`, {
      method: 'DELETE',
    }),

  // GET /api/tenant/hierarchy - Get Tenant Hierarchy
  getTenantHierarchy: () => request('/tenant/hierarchy'),

  // ==================== SUPPLIERS & CATALOGS ====================
  // GET /api/suppliers - List Suppliers
  getSuppliers: () => request('/suppliers'),

  // POST /api/suppliers - Create Supplier
  createSupplier: (data) =>
    request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // GET /api/suppliers/{supplier_id} - Get Supplier
  getSupplierById: (supplierId) =>
    request(`/suppliers/${encodeURIComponent(supplierId)}`),

  // ==================== ANALYTICS & INSIGHTS ====================
  // GET /api/analytics/low-stock - Get Low Stock Summary
  getLowStockAnalytics: () => request('/analytics/low-stock'),

  // GET /api/analytics/gaps - Get Shelf Gap Analytics
  getGapAnalytics: () => request('/analytics/gaps'),

  // ==================== INVENTORY RECOMMENDATIONS ====================
  // GET /api/inventory/reorder-recommendations
  getReorderRecommendations: (params = {}) => {
    const query = new URLSearchParams()
    if (params.history_window_days) query.append('history_window_days', params.history_window_days)
    if (params.review_period_days) query.append('review_period_days', params.review_period_days)
    if (params.reorder_only !== undefined) query.append('reorder_only', String(params.reorder_only))
    if (params.category) query.append('category', params.category)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/inventory/reorder-recommendations${qs}`)
  },

  // GET /api/inventory/recommendations
  getInventoryRecommendations: (params = {}) => {
    const query = new URLSearchParams()
    if (params.history_window_days) query.append('history_window_days', params.history_window_days)
    if (params.review_period_days) query.append('review_period_days', params.review_period_days)
    if (params.reorder_only !== undefined) query.append('reorder_only', String(params.reorder_only))
    if (params.category) query.append('category', params.category)
    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/inventory/recommendations${qs}`)
  },

  // ==================== HEALTH & ROOT ====================
  // GET /health - Health Check
  getHealth: () => {
    const rootBase = API_BASE.replace(/\/api\/?$/, '')
    return fetch(`${rootBase}/health`).then((r) => r.json())
  },

  // GET / - Root API Info
  getRoot: () => {
    const rootBase = API_BASE.replace(/\/api\/?$/, '')
    return fetch(`${rootBase}/`).then((r) => r.json())
  },
}
