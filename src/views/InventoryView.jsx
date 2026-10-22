import React, { useState } from 'react'

export default function InventoryView({ inventory }) {
  const [selectedProduct, setSelectedProduct] = useState(inventory[0] || null)

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Inventory Table (2 cols) */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400 font-medium border-b border-slate-100">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Stock / target</th>
                <th className="pb-3 font-medium">Level</th>
                <th className="pb-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.slice(0, 3).map((item) => {
                const percentage = Math.min(100, Math.round((item.current / item.target) * 100))
                const isLow = item.status === 'Low' || percentage < 35
                const isSelected = selectedProduct?.id === item.id

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-50/60' : ''
                    }`}
                  >
                    <td className="py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-4 text-slate-600">
                      {item.current} / {item.target}
                    </td>
                    <td className="py-4 w-48">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLow ? 'bg-red-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`text-xs font-semibold ${
                          isLow ? 'text-red-500' : 'text-emerald-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Right: Stock History Bar Chart (1 col) */}
        {selectedProduct && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {selectedProduct.name} · stock history
                </h2>
                <span className="text-xs text-slate-400">Last 7 scans</span>
              </div>

              {/* 7 Vertical Bars */}
              <div className="h-44 pt-6 pb-2 flex items-end justify-between gap-3 px-2">
                {selectedProduct.history.map((val, idx) => {
                  const heightPercent = Math.max(15, Math.round((val / selectedProduct.target) * 100))
                  const isLast = idx === selectedProduct.history.length - 1
                  const isLowVal = val <= 2

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end"
                    >
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-xs transition-all ${
                          isLast && isLowVal ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                      ></div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Target: {selectedProduct.target}</span>
              <span>Latest scan: {selectedProduct.current} left</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
