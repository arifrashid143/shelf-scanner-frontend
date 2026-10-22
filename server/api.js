import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'shelf-scanner-secret-key-2026-super-secure'

// In-memory Database initialized with realistic store data
const users = [
  {
    id: 'u-admin-1',
    email: 'admin@shelfscanner.com',
    password: 'admin123',
    name: 'Sarah Connor (Admin)',
    role: 'admin',
    store: 'Main Store',
  },
  {
    id: 'u-user-1',
    email: 'user@shelfscanner.com',
    password: 'user123',
    name: 'Alex Rivera (Staff)',
    role: 'user',
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

// Strict Admin-only middleware: prevents non-admin users from performing restricted operations
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Admin privileges required for this action.',
      userRole: req.user?.role || 'anonymous',
    })
  }
  next()
}

// ==================== AUTH ROUTES ====================

// POST /api/auth/login
apiApp.post('/auth/login', (req, res) => {
  const { email, password } = req.body

  const user = users.find(
    (u) => u.email.toLowerCase() === email?.toLowerCase() && u.password === password
  )

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    store: user.store,
  }

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' })

  res.json({
    message: 'Login successful',
    token,
    user: tokenPayload,
  })
})

// GET /api/auth/me - Verify current token and return user profile + role
apiApp.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
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

