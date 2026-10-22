export const initialInventory = [
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

export const initialPurchaseOrders = [
  {
    id: 'PO-1042',
    supplier: 'Stationery Hub',
    scanSource: 'Aisle 3, Shelf B',
    date: 'Today',
    status: 'Draft',
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
    items: [
      { id: 'prod-bev', name: 'Sparkling Water 24pk', stock: 8, target: 12, qty: 4, unitPrice: 1200 },
    ],
    total: 4800,
  },
]

export const initialRecentScans = [
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

export const defaultScanResult = {
  shelfName: 'Aisle 3, Shelf B',
  timestamp: 'Just now',
  itemsCounted: 8,
  emptyGaps: 2,
  detections: [
    { name: 'Pen Box', count: 2, confidence: 92, target: 10 },
    { name: 'Stapler', count: 1, confidence: 88, target: 6 },
    { name: 'Tape', count: 3, confidence: 95, target: 4 },
  ],
  // Visual layout of shelf 1 (top) and shelf 2 (bottom)
  shelfBoxes: [
    // Top shelf
    { id: 'b1', shelf: 1, type: 'box', label: 'Pen Box 92%', color: 'border-blue-600 bg-amber-400/80', conf: 92, x: 5, width: 14 },
    { id: 'b2', shelf: 1, type: 'box', label: 'Pen Box', color: 'border-blue-600 bg-amber-400/80', conf: 91, x: 21, width: 14 },
    { id: 'b3', shelf: 1, type: 'box', label: 'Pen Box', color: 'border-blue-600 bg-amber-400/80', conf: 89, x: 37, width: 14 },
    { id: 'g1', shelf: 1, type: 'gap', label: 'GAP', color: 'border-red-500 bg-red-100/40 border-dashed', conf: 94, x: 53, width: 16 },
    { id: 'b4', shelf: 1, type: 'box', label: 'Stapler 88%', color: 'border-blue-600 bg-amber-500/80', conf: 88, x: 71, width: 14 },
    { id: 'b5', shelf: 1, type: 'box', label: 'Stapler', color: 'border-blue-600 bg-amber-500/80', conf: 86, x: 86, width: 10 },
    
    // Bottom shelf
    { id: 'b6', shelf: 2, type: 'box', label: 'Tape 95%', color: 'border-emerald-600 bg-emerald-300/80', conf: 95, x: 5, width: 22 },
    { id: 'b7', shelf: 2, type: 'box', label: 'Tape', color: 'border-emerald-600 bg-emerald-300/80', conf: 93, x: 29, width: 22 },
    { id: 'g2', shelf: 2, type: 'gap', label: 'GAP', color: 'border-red-500 bg-red-100/40 border-dashed', conf: 96, x: 53, width: 24 },
    { id: 'b8', shelf: 2, type: 'box', label: 'Tape', color: 'border-emerald-600 bg-emerald-300/80', conf: 94, x: 79, width: 17 },
  ],
}

