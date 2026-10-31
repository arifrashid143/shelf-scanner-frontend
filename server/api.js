import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'shelf-scanner-secret-key-2026-super-secure'

// In-memory Database initialized with realistic store data
// Supports Superadmin, Tenant Admins, and Store Staff (aligned with Swagger spec)
const users = [
  {
    id: 'u-superadmin-1',
    email: 'superadmin@shelfscanner.com',
    password: 'superadmin123',
    name: 'Eleanor Vance (Superadmin)',
    role: 'superadmin',
    tenant_id: 'tenant-global',
    store: 'Enterprise HQ',
  },
  {
    id: 'u-tenantadmin-1',
    email: 'tenantadmin@shelfscanner.com',
    password: 'tenantadmin123',
    name: 'Marcus Brody (Tenant Admin)',
    role: 'tenant_admin',
    tenant_id: 'tenant-corp-1',
    store: 'Metro Region',
  },
  {
    id: 'u-admin-1',
    email: 'admin@shelfscanner.com',
    password: 'admin123',
    name: 'Sarah Connor (Admin)',
    role: 'admin',
    tenant_id: 'tenant-corp-1',
    store: 'Main Store',
  },
  {
    id: 'u-staff-1',
    email: 'staff@shelfscanner.com',
    password: 'staff123',
    name: 'Jordan Lee (Store Staff)',
    role: 'store_staff',
    tenant_id: 'tenant-corp-1',
    store: 'Main Store',
  },
  {
    id: 'u-user-1',
    email: 'user@shelfscanner.com',
    password: 'user123',
    name: 'Alex Rivera (Staff User)',
    role: 'user',
    tenant_id: 'tenant-corp-1',
    store: 'Main Store',
  },
]

let inventory = [
  {
    id: 'prod-1',
    name: 'Pen Box',
    current: 2,
    target: 10,
    price: 850,
    status: 'Low',
    history: [9, 8, 7, 8, 6, 4, 2],
  },
  {
    id: 'prod-2',
    name: 'Stapler',
    current: 1,
    target: 6,
    price: 620,
    status: 'Low',
    history: [6, 5, 5, 4, 3, 2, 1],
  },
  {
    id: 'prod-3',
    name: 'Tape',
    current: 3,
    target: 4,
    price: 250,
    status: 'OK',
    history: [4, 4, 3, 4, 3, 4, 3],
  },
  {
    id: 'prod-4',
    name: 'Notebook A5',
    current: 4,
    target: 20,
    price: 531.25,
    status: 'Low',
    history: [18, 16, 14, 11, 8, 6, 4],
  },
  {
    id: 'prod-5',
    name: 'Highlighter Pack',
    current: 12,
    target: 12,
    price: 320,
    status: 'OK',
    history: [12, 12, 11, 12, 10, 12, 12],
  },
]

let purchaseOrders = [
  {
    id: 'PO-1042',
    supplier: 'Stationery Hub',
    scanSource: 'Aisle 3, Shelf B',
    date: 'Today',
    status: 'Draft',
    createdBy: 'Alex Rivera (Staff)',
    items: [
      { id: 'prod-1', name: 'Pen Box', stock: 2, target: 10, qty: 8, unitPrice: 850 },
      { id: 'prod-2', name: 'Stapler', stock: 1, target: 6, qty: 5, unitPrice: 620 },
      { id: 'prod-4', name: 'Notebook A5', stock: 4, target: 20, qty: 16, unitPrice: 531.25 },
    ],
    total: 18400,
  },
  {
    id: 'PO-1041',
    supplier: 'Snack Traders',
    scanSource: 'Aisle 1, Shelf D',
    date: 'Today',
    status: 'Draft',
    createdBy: 'System AI',
    items: [
      { id: 'prod-snack-1', name: 'Potato Chips Box', stock: 3, target: 12, qty: 9, unitPrice: 550 },
      { id: 'prod-snack-2', name: 'Chocolate Bar Pack', stock: 2, target: 8, qty: 6, unitPrice: 716.66 },
    ],
    total: 9250,
  },
  {
    id: 'PO-1040',
    supplier: 'Stationery Hub',
    scanSource: 'Aisle 2, Shelf A',
    date: 'Yesterday',
    status: 'Approved',
    createdBy: 'Alex Rivera (Staff)',
    items: [
      { id: 'prod-paper', name: 'A4 Copier Paper', stock: 5, target: 15, qty: 10, unitPrice: 610 },
    ],
    total: 6100,
  },
  {
    id: 'PO-1039',
    supplier: 'Beverage Co',
    scanSource: 'Aisle 4, Shelf A',
    date: '2 days ago',
    status: 'Rejected',
    createdBy: 'System AI',
    items: [
      { id: 'prod-bev', name: 'Sparkling Water 24pk', stock: 8, target: 12, qty: 4, unitPrice: 1200 },
    ],
    total: 4800,
  },
]

let recentScans = [
  {
    id: 'scan-1',
    shelf: 'Aisle 3 · Shelf B',
    when: '10 min ago',
    gaps: 2,
    status: 'Done',
  },
  {
    id: 'scan-2',
    shelf: 'Aisle 1 · Shelf A',
    when: '1 hr ago',
    gaps: 0,
    status: 'Done',
  },
  {
    id: 'scan-3',
    shelf: 'Aisle 5 · Shelf C',
    when: 'Just now',
    gaps: '-',
    status: 'Processing',
  },
]

export const apiApp = express()

apiApp.use(cors())
apiApp.use(express.json())

// --- Authorization Middleware ---

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = decoded
    next()
  })
}

// Strict Admin-only middleware: checks for Superadmin, Tenant Admin, or Store Admin
export function requireAdmin(req, res, next) {
  const role = (req.user?.role || '').toLowerCase()
  const isAdminRole =
    role === 'admin' ||
    role === 'superadmin' ||
    role === 'super_admin' ||
    role === 'tenant_admin' ||
    role.includes('admin')

  if (!req.user || !isAdminRole) {
    return res.status(403).json({
      error: 'Forbidden: Admin privileges required for this action.',
      userRole: req.user?.role || 'anonymous',
    })
  }
  next()
}

// ==================== AUTH ROUTES ====================

// POST /api/auth/login
// Authenticates Superadmin, Tenant Admins, and Store Staff.
// Returns signed JWT Bearer token with embedded role and tenant identity.
apiApp.post('/auth/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = users.find(
    (u) => u.email.toLowerCase() === email?.toLowerCase() && u.password === password
  )

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const tokenPayload = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenant_id: user.tenant_id || 'tenant-corp-1',
    tenant: user.tenant_id || 'Main Retail Chain',
    store: user.store,
  }

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' })

  res.json({
    message: 'Login successful',
    token,
    access_token: token,
    token_type: 'Bearer',
    user: tokenPayload,
  })
})

// POST /api/auth/signup
apiApp.post('/auth/signup', (req, res) => {
  const { name, email, password, role } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' })
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'store_staff',
    tenant_id: 'tenant-corp-1',
    store: 'Main Store',
  }

  users.push(newUser)

  const tokenPayload = {
    id: newUser.id,
    sub: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    tenant_id: newUser.tenant_id,
    tenant: newUser.tenant_id,
    store: newUser.store,
  }

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' })

  res.status(201).json({
    message: 'Account created successfully',
    token,
    access_token: token,
    token_type: 'Bearer',
    user: tokenPayload,
  })
})

// GET /api/auth/me - Verify current token and return user profile + role + tenant
apiApp.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    message: 'Current user profile retrieved',
    user: req.user,
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
    tenant_id: req.user.tenant_id,
    tenant: req.user.tenant,
  })
})

// POST /api/auth/logout
apiApp.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// ==================== INVENTORY ROUTES ====================

// GET /api/inventory - Accessible to BOTH Admin and User (View Inventory)
apiApp.get('/inventory', authenticateToken, (req, res) => {
  res.json({ inventory })
})

// POST /api/inventory/update - ADMIN ONLY: update product stock and target
apiApp.post('/inventory/update', authenticateToken, requireAdmin, (req, res) => {
  const { id, current, target, name, price } = req.body

  const itemIndex = inventory.findIndex((item) => item.id === id)
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Product not found' })
  }

  const currentVal = current !== undefined ? parseInt(current, 10) : inventory[itemIndex].current
  const targetVal = target !== undefined ? parseInt(target, 10) : inventory[itemIndex].target
  const status = currentVal >= targetVal ? 'OK' : 'Low'

  inventory[itemIndex] = {
    ...inventory[itemIndex],
    current: currentVal,
    target: targetVal,
    name: name || inventory[itemIndex].name,
    price: price !== undefined ? parseFloat(price) : inventory[itemIndex].price,
    status,
    history: [...inventory[itemIndex].history.slice(1), currentVal],
  }

  res.json({
    message: 'Inventory updated successfully',
    product: inventory[itemIndex],
    inventory,
  })
})

// POST /api/inventory/add - ADMIN ONLY: create a new product SKU
apiApp.post('/inventory/add', authenticateToken, requireAdmin, (req, res) => {
  const { name, current, target, price } = req.body

  if (!name || target === undefined) {
    return res.status(400).json({ error: 'Name and Target are required' })
  }

  const currentCount = parseInt(current || 0, 10)
  const targetCount = parseInt(target, 10)

  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    current: currentCount,
    target: targetCount,
    price: parseFloat(price || 500),
    status: currentCount >= targetCount ? 'OK' : 'Low',
    history: [targetCount, targetCount, targetCount, targetCount, targetCount, currentCount, currentCount],
  }

  inventory.push(newProduct)

  res.status(201).json({
    message: 'Product added successfully',
    product: newProduct,
    inventory,
  })
})

// ==================== PURCHASE ORDERS ROUTES ====================

// GET /api/orders - Accessible to BOTH Admin and User
apiApp.get('/orders', authenticateToken, (req, res) => {
  res.json({ purchaseOrders })
})

// POST /api/orders/generate - Accessible to BOTH Admin and User (Generate Purchase Orders)
apiApp.post('/orders/generate', authenticateToken, (req, res) => {
  const { supplier, scanSource, items } = req.body

  // Generate suggested items based on low stock or provided items
  const orderItems = items || [
    { id: 'prod-1', name: 'Pen Box', stock: 2, target: 10, qty: 8, unitPrice: 850 },
    { id: 'prod-2', name: 'Stapler', stock: 1, target: 6, qty: 5, unitPrice: 620 },
    { id: 'prod-4', name: 'Notebook A5', stock: 4, target: 20, qty: 16, unitPrice: 531.25 },
  ]

  const total = orderItems.reduce((acc, curr) => acc + curr.qty * (curr.unitPrice || 600), 0)

  const newPO = {
    id: `PO-${1043 + purchaseOrders.length}`,
    supplier: supplier || 'Stationery Hub',
    scanSource: scanSource || 'Aisle 3, Shelf B',
    date: 'Today',
    status: 'Draft',
    createdBy: req.user.name,
    items: orderItems,
    total,
  }

  purchaseOrders.unshift(newPO)

  res.status(201).json({
    message: 'Purchase Order generated successfully',
    order: newPO,
    purchaseOrders,
  })
})

// POST /api/orders/:id/approve - ADMIN ONLY: Accept/Approve purchase order
apiApp.post('/orders/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params
  const orderIndex = purchaseOrders.findIndex((po) => po.id === id)

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Purchase Order not found' })
  }

  // Update order status
  purchaseOrders[orderIndex].status = 'Approved'
  purchaseOrders[orderIndex].approvedBy = req.user.name
  purchaseOrders[orderIndex].approvedAt = new Date().toISOString()

  // Restock inventory accordingly
  purchaseOrders[orderIndex].items.forEach((ordered) => {
    const invItem = inventory.find((i) => i.id === ordered.id)
    if (invItem) {
      const newCount = Math.min(invItem.target, invItem.current + ordered.qty)
      invItem.current = newCount
      invItem.status = newCount >= invItem.target ? 'OK' : 'Low'
      invItem.history = [...invItem.history.slice(1), newCount]
    }
  })

  res.json({
    message: `Order ${id} approved and inventory replenished`,
    order: purchaseOrders[orderIndex],
    purchaseOrders,
    inventory,
  })
})

// POST /api/orders/:id/reject - ADMIN ONLY: Reject purchase order
apiApp.post('/orders/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params
  const orderIndex = purchaseOrders.findIndex((po) => po.id === id)

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Purchase Order not found' })
  }

  purchaseOrders[orderIndex].status = 'Rejected'
  purchaseOrders[orderIndex].rejectedBy = req.user.name
  purchaseOrders[orderIndex].rejectedAt = new Date().toISOString()

  res.json({
    message: `Order ${id} rejected`,
    order: purchaseOrders[orderIndex],
    purchaseOrders,
  })
})

// ==================== SCANS ROUTES ====================

// GET /api/scans - Accessible to BOTH Admin and User
apiApp.get('/scans', authenticateToken, (req, res) => {
  res.json({ recentScans })
})

// POST /api/scans/analyze - Accessible to BOTH Admin and User
apiApp.post('/scans/analyze', authenticateToken, (req, res) => {
  const { shelfName } = req.body

  const newScan = {
    id: `scan-${Date.now()}`,
    shelf: shelfName || 'Aisle 3 · Shelf B',
    when: 'Just now',
    gaps: 2,
    status: 'Done',
    scannedBy: req.user.name,
  }

  recentScans.unshift(newScan)

  res.json({
    message: 'Shelf scan analyzed successfully',
    scan: newScan,
    recentScans,
  })
})

// ==================== TENANT ADMINISTRATION (COMPANY WORKSPACE) ====================
let tenantStores = [
  { id: 'store_main', name: 'Main Store', code: 'STORE-01', address: '123 Market St', city: 'Metro' },
  { id: 'store_north', name: 'North Branch', code: 'STORE-02', address: '456 North Ave', city: 'Metro' },
]

// GET /api/tenant/users - List Company Users
apiApp.get('/tenant/users', authenticateToken, (req, res) => {
  const companyUsers = users.map((u, idx) => ({
    id: typeof u.id === 'number' ? u.id : idx + 1,
    email: u.email,
    full_name: u.full_name || u.name,
    role: (u.role || 'USER').toUpperCase(),
    store_id: u.store_id || u.store || 'store_main',
    is_active: u.is_active !== undefined ? u.is_active : true,
    tenant_id: u.tenant_id || 'tenant-corp-1',
    created_at: u.created_at || '2026-03-15T10:00:00Z',
  }))
  res.json(companyUsers)
})

// POST /api/tenant/users - Create Company User
apiApp.post('/tenant/users', authenticateToken, requireAdmin, (req, res) => {
  const { email, password, full_name, role, store_id } = req.body
  if (!email || !password || !full_name) {
    return res.status(400).json({ detail: 'Email, password, and full_name are required' })
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    return res.status(400).json({ detail: 'A user with this email already exists' })
  }

  const newUser = {
    id: users.length + 1,
    email,
    password,
    name: full_name,
    full_name,
    role: (role || 'USER').toUpperCase(),
    store_id: store_id || 'store_main',
    store: store_id || 'Main Store',
    is_active: true,
    tenant_id: req.user.tenant_id || 'tenant-corp-1',
    created_at: new Date().toISOString(),
  }

  users.push(newUser)

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name,
    role: newUser.role,
    store_id: newUser.store_id,
    is_active: newUser.is_active,
    tenant_id: newUser.tenant_id,
    created_at: newUser.created_at,
  })
})

// PUT /api/tenant/users/:user_id - Update Company User
apiApp.put('/tenant/users/:user_id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.user_id
  const user = users.find((u, idx) => String(u.id) === String(userId) || String(idx + 1) === String(userId))

  if (!user) {
    return res.status(404).json({ detail: 'User not found' })
  }

  const { full_name, role, store_id, is_active, password } = req.body
  if (full_name !== undefined) {
    user.name = full_name
    user.full_name = full_name
  }
  if (role !== undefined) user.role = role
  if (store_id !== undefined) {
    user.store_id = store_id
    user.store = store_id
  }
  if (is_active !== undefined) user.is_active = is_active
  if (password) user.password = password

  res.json({
    id: user.id,
    email: user.email,
    full_name: user.full_name || user.name,
    role: user.role,
    store_id: user.store_id,
    is_active: user.is_active !== undefined ? user.is_active : true,
    tenant_id: user.tenant_id,
    created_at: user.created_at || '2026-03-15T10:00:00Z',
  })
})

// DELETE /api/tenant/users/:user_id - Deactivate Company User
apiApp.delete('/tenant/users/:user_id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.user_id
  const user = users.find((u, idx) => String(u.id) === String(userId) || String(idx + 1) === String(userId))

  if (!user) {
    return res.status(404).json({ detail: 'User not found' })
  }

  user.is_active = false
  res.json({ message: 'User deactivated successfully', id: user.id, is_active: false })
})

// GET /api/tenant/stores - List Company Stores
apiApp.get('/tenant/stores', authenticateToken, (req, res) => {
  res.json(tenantStores)
})

// POST /api/tenant/stores - Create Company Store
apiApp.post('/tenant/stores', authenticateToken, requireAdmin, (req, res) => {
  const { id, name, code, address, city } = req.body
  if (!id || !name) {
    return res.status(400).json({ detail: 'Store id and name are required' })
  }

  const newStore = { id, name, code: code || id, address: address || '', city: city || '' }
  tenantStores.push(newStore)
  res.status(201).json(newStore)
})

