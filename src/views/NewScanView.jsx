import { useState, useRef } from 'react'

export default function NewScanView({ onScanComplete }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanMode, setScanMode] = useState('check') // 'check' | 'baseline'
  const [flashOn, setFlashOn] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      onScanComplete({
        shelfName: 'Aisle 3, Shelf B',
      })
    }, 1200)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hidden file input for mobile & desktop */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ===================== MOBILE LAYOUT (Pages 2 & 14) ===================== */}
      <div className="md:hidden space-y-4">
        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">New scan</h1>

        {/* Tab switcher: Check shelf vs Set baseline (Page 14) */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setScanMode('check')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              scanMode === 'check'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Check shelf
          </button>
          <button
            type="button"
            onClick={() => setScanMode('baseline')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              scanMode === 'baseline'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Set baseline
          </button>
        </div>

        {/* Subtitle instructions */}
        <p className="text-xs text-slate-500 leading-relaxed">
          {scanMode === 'check'
            ? "Compare today's shelf with your saved full shelf. Use Set baseline the first time."
            : 'Capture the fully-stocked reference shelf once to establish the stock target.'}
        </p>

        {/* Camera Viewfinder Box (Page 14) */}
        <div className="relative bg-[#1a2332] rounded-3xl aspect-[4/4] flex items-center justify-center p-6 text-center shadow-lg border border-slate-800 overflow-hidden">
          {/* Dashed alignment frame */}
          <div className="w-full h-full border-2 border-dashed border-blue-400/70 rounded-2xl flex flex-col items-center justify-center p-4">
            {isAnalyzing ? (
              <div className="text-white space-y-2">
                <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-sm">Analyzing shelf objects…</p>
                <p className="text-xs text-slate-400">Arrives in ~30 seconds</p>
              </div>
            ) : (
              <p className="text-white/90 text-sm font-semibold tracking-wide">
                Fit the whole shelf in the frame
              </p>
            )}
          </div>
        </div>

        {/* Camera Controls Bar (Page 14) */}
        <div className="pt-2 flex items-center justify-between px-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-bold text-xs shadow-xs active:scale-95 transition-transform"
          >
            Gallery
          </button>

          {/* Large Circular Shutter Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-18 h-18 rounded-full bg-blue-600 shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
            aria-label="Capture photo"
          >
            <div className="w-14 h-14 rounded-full border-2 border-white/60 bg-blue-600"></div>
          </button>

          <button
            type="button"
            onClick={() => setFlashOn(!flashOn)}
            className={`px-6 py-3 rounded-2xl border font-bold text-xs shadow-xs transition-colors active:scale-95 ${
              flashOn
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200/90 text-slate-800'
            }`}
          >
            Flash
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          Results ready in about 30 seconds
        </p>
      </div>

      {/* ===================== DESKTOP LAYOUT (Page 8) ===================== */}
      <div className="hidden md:block space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New scan</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Drag and Drop Card (2 cols) */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-400/80 rounded-xl p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <p className="font-semibold text-slate-900 text-base mb-1">
                Drag and drop a shelf photo
              </p>
              <p className="text-xs text-slate-400 mb-5">JPG or PNG, up to 10 MB</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Browse files
              </button>
            </div>

            {/* Action Row */}
            <div className="mt-6 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedFile ? selectedFile.name : 'No photo selected'}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {isAnalyzing ? 'Analyzing…' : 'Analyze shelf'}
              </button>
            </div>
          </div>

          {/* Right Info Cards (1 col) */}
          <div className="space-y-6">
            {/* Tips for a good scan */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Tips for a good scan</h2>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>Shoot the whole shelf straight on.</li>
                <li>Avoid glare and shadows.</li>
                <li>Keep the camera steady.</li>
                <li>Results take about 30 seconds.</li>
              </ul>
            </div>

            {/* Recent uploads */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Recent uploads</h2>
              <div className="text-xs text-slate-600 space-y-2.5">
                <p className="hover:text-blue-600 cursor-pointer">Aisle 3 · Shelf B</p>
                <p className="hover:text-blue-600 cursor-pointer">Aisle 1 · Shelf A</p>
                <p className="hover:text-blue-600 cursor-pointer">Aisle 5 · Shelf C</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
