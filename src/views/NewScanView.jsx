import React, { useState, useRef } from 'react'

export default function NewScanView({ onScanComplete }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
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
  )
}
