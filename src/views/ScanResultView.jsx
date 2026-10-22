import { useState } from 'react'
import { defaultScanResult } from '../data/mockData'

export default function ScanResultView({ onDone, onGeneratePO }) {
  const [showBoxes, setShowBoxes] = useState(true)
  const [showGaps, setShowGaps] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState(80)

  const { shelfBoxes, detections, itemsCounted, emptyGaps } = defaultScanResult

  // Filter shelf elements based on toggles
  const visibleBoxes = shelfBoxes.filter((item) => {
    if (item.type === 'box' && !showBoxes) return false
    if (item.type === 'gap' && !showGaps) return false
    if (item.conf < confidenceThreshold) return false
    return true
  })

  const shelf1Items = visibleBoxes.filter((b) => b.shelf === 1)
  const shelf2Items = visibleBoxes.filter((b) => b.shelf === 2)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ===================== MOBILE LAYOUT (Pages 3 & 15) ===================== */}
      <div className="md:hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Scan result</h1>
          <button
            onClick={onDone}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Done
          </button>
        </div>

        {/* 2D Shelf Visualizer Canvas (Page 15) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="bg-[#e9eff6] rounded-2xl p-4 border border-slate-200 overflow-x-auto">
            <div className="min-w-[420px] space-y-6">
              {/* Shelf Tier 1 */}
              <div>
                <div className="h-28 relative flex items-end">
                  {shelf1Items.map((item) => (
                    <div
                      key={item.id}
                      style={{ left: `${item.x}%`, width: `${item.width}%` }}
                      className={`absolute bottom-0 h-24 rounded-sm flex flex-col justify-start p-1 border-2 ${
                        item.type === 'gap'
                          ? 'border-red-500 border-dashed bg-red-100/50'
                          : 'border-blue-600 bg-[#f7b05b]'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none w-max ${
                          item.type === 'gap' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-3 bg-[#9aa6b2] rounded-xs shadow-inner"></div>
              </div>

              {/* Shelf Tier 2 */}
              <div>
                <div className="h-24 relative flex items-end">
                  {shelf2Items.map((item) => (
                    <div
                      key={item.id}
                      style={{ left: `${item.x}%`, width: `${item.width}%` }}
                      className={`absolute bottom-0 h-20 rounded-sm flex flex-col justify-start p-1 border-2 ${
                        item.type === 'gap'
                          ? 'border-red-500 border-dashed bg-red-100/50'
                          : 'border-emerald-700 bg-[#70c1b3]'
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none w-max ${
                          item.type === 'gap' ? 'bg-red-600 text-white' : 'bg-emerald-800 text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-3 bg-[#9aa6b2] rounded-xs shadow-inner"></div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                showBoxes ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Boxes
            </button>
            <button
              onClick={() => setShowGaps(!showGaps)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                showGaps ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Gaps
            </button>
            <button
              onClick={() => setConfidenceThreshold(confidenceThreshold === 80 ? 0 : 80)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                confidenceThreshold >= 80
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              80%+
            </button>
          </div>
        </div>

        {/* Full shelf vs now list (Page 15) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-sm">Full shelf vs now</h2>
            <span className="text-xs font-semibold text-slate-500">2 gaps found</span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Pen Box</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-mono">10 → 2</span>
                <span className="w-10 text-center font-extrabold text-xs py-1 rounded-xl bg-rose-100 text-rose-600">
                  -8
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Stapler</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-mono">6 → 1</span>
                <span className="w-10 text-center font-extrabold text-xs py-1 rounded-xl bg-rose-100 text-rose-600">
                  -5
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Tape</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-mono">4 → 3</span>
                <span className="w-10 text-center font-extrabold text-xs py-1 rounded-xl bg-rose-100 text-rose-600">
                  -1
                </span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <button
              onClick={onGeneratePO}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all text-center"
            >
              Create order for 14 items
            </button>
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT (Page 9) ===================== */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Scan result · Aisle 3, Shelf B
          </h1>
          <button
            onClick={onDone}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Done
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: 2D Shelf Visualizer (2 cols) */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <div className="bg-[#e9eff6] rounded-xl p-6 border border-slate-200 space-y-8">
                {/* Shelf Tier 1 */}
                <div>
                  <div className="h-32 relative flex items-end">
                    {shelf1Items.map((item) => (
                      <div
                        key={item.id}
                        style={{ left: `${item.x}%`, width: `${item.width}%` }}
                        className={`absolute bottom-0 h-28 rounded-sm transition-all flex flex-col justify-start p-1 border-2 ${
                          item.type === 'gap'
                            ? 'border-red-500 border-dashed bg-red-100/50'
                            : 'border-blue-600 bg-[#f7b05b]'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none w-max ${
                            item.type === 'gap' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-3.5 bg-[#9aa6b2] rounded-xs shadow-inner"></div>
                </div>

                {/* Shelf Tier 2 */}
                <div>
                  <div className="h-28 relative flex items-end">
                    {shelf2Items.map((item) => (
                      <div
                        key={item.id}
                        style={{ left: `${item.x}%`, width: `${item.width}%` }}
                        className={`absolute bottom-0 h-24 rounded-sm transition-all flex flex-col justify-start p-1 border-2 ${
                          item.type === 'gap'
                            ? 'border-red-500 border-dashed bg-red-100/50'
                            : 'border-emerald-700 bg-[#70c1b3]'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none w-max ${
                            item.type === 'gap' ? 'bg-red-600 text-white' : 'bg-emerald-800 text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-3.5 bg-[#9aa6b2] rounded-xs shadow-inner"></div>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  showBoxes ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                Boxes
              </button>
              <button
                onClick={() => setShowGaps(!showGaps)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  showGaps ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                Gaps
              </button>
              <button
                onClick={() => setConfidenceThreshold(confidenceThreshold === 80 ? 0 : 80)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  confidenceThreshold >= 80
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                Confidence ≥ 80%
              </button>
            </div>
          </div>

          {/* Right: Stats & Detections (1 col) */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-slate-500 mb-1">Items counted</p>
                <p className="text-3xl font-bold text-slate-900">{itemsCounted}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                <p className="text-xs font-medium text-slate-500 mb-1">Empty gaps</p>
                <p className="text-3xl font-bold text-red-500">{emptyGaps}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[300px]">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-3">Detections</h2>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Count</th>
                      <th className="pb-2 font-medium text-right">Conf.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detections.map((d) => (
                      <tr key={d.name}>
                        <td className="py-2.5 font-medium text-slate-900">{d.name}</td>
                        <td className="py-2.5 text-slate-600">{d.count}</td>
                        <td className="py-2.5 text-right text-slate-600">{d.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Low stock</p>
                  <p className="text-xs text-slate-500">
                    Pen Box and Stapler are below target
                  </p>
                </div>
                <button
                  onClick={onGeneratePO}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors text-center"
                >
                  Generate purchase order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
