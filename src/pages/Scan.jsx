import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import {
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Scan as ScanIcon,
  Check,
  MoreVertical,
  Copy,
  Clock,
  ArrowRight,
} from 'lucide-react'

export default function Scan({
  onScanComplete,
  recentScans = [],
  onSelectScan,
  isLoading = false,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const scanMode = 'check' // Default check mode
  const shelfName = 'Shelf Section 1' // Default shelf section
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Configured Shelves from API
  const [configuredShelves, setConfiguredShelves] = useState([])
  const [selectedShelfId, setSelectedShelfId] = useState('')

  // Recent Scans Modal State
  const [isRecentScansModalOpen, setIsRecentScansModalOpen] = useState(false)

  // Actions Modal State (Three Dots)
  const [actionModalScan, setActionModalScan] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment') // 'environment' (back) | 'user' (front)

  const galleryInputRef = useRef(null)
  const streamRef = useRef(null)
  const videoRef = useRef(null)

  // Fetch configured shelves on mount
  useEffect(() => {
    api
      .getTenantShelves()
      .then((res) => {
        const raw = Array.isArray(res) ? res : res?.items || res?.shelves || []
        setConfiguredShelves(raw)
        if (raw.length > 0) {
          setSelectedShelfId(raw[0].id)
        }
      })
      .catch(() => {})
  }, [])

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Stop active camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  // Start live camera stream using getUserMedia
  const startCamera = async (facing = cameraFacingMode) => {
    setErrorMsg('')
    stopCamera()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access is not supported by your browser or requires a secure (HTTPS or localhost) connection.')
      return
    }

    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })
      } catch {
        // Fallback to basic video constraint if ideal resolution/facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream
      setIsCameraActive(true)

      // Bind stream to video element on next frame
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch (err) {
      console.error('Camera access error:', err)
      setIsCameraActive(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera access was denied. Please allow camera permissions in your browser address bar settings to scan shelves directly.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera device found on this system. You can still upload shelf photos using the Gallery/File option.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMsg('Camera is currently in use by another application. Please close other camera tabs or apps and try again.')
      } else {
        setErrorMsg(`Unable to access camera: ${err.message || 'Unknown device error'}`)
      }
    }
  }

  // Toggle front/back camera
  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment'
    setCameraFacingMode(nextFacing)
    await startCamera(nextFacing)
  }

  // Submit scan to AI backend
  const triggerAnalyze = async (fileToUpload, localPreview) => {
    setIsAnalyzing(true)
    setErrorMsg('')
    setAnalysisStatus('Uploading photo to AI shelf vision engine (POST /api/scans)...')

    const selectedShelf = configuredShelves.find((s) => s.id === selectedShelfId)
    const finalShelfName = selectedShelf?.name || shelfName.trim() || 'Shelf Section 1'
    const finalShelfId = selectedShelf?.id || undefined

    try {
      await onScanComplete({
        file: fileToUpload,
        previewUrl: localPreview,
        shelfName: finalShelfName,
        shelf_id: finalShelfId,
        scanMode,
      })
    } catch (err) {
      console.error('Scan analysis error:', err)
      setErrorMsg(err.message || 'Failed to analyze shelf photo. Please try again.')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStatus('')
    }
  }

  // Capture frame from active video stream into File + Preview
  const capturePhoto = () => {
    const video = videoRef.current

    if (!video || !video.videoWidth) {
      setErrorMsg('Camera stream is not ready. Please wait a moment and try again.')
      return
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setErrorMsg('Failed to create photo from camera frame.')
            return
          }
          const file = new File([blob], `shelf_capture_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
          setSelectedFile(file)
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          setErrorMsg('')
          stopCamera()
        },
        'image/jpeg',
        0.92
      )
    } catch (err) {
      console.error('Photo capture error:', err)
      setErrorMsg('Failed to capture photo from video stream.')
    }
  }

  // File picker handler (Gallery / File Explorer)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      stopCamera()
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setErrorMsg('')
    }
  }

  // Clear preview and return to initial state
  const handleClearImage = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    stopCamera()
  }

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      stopCamera()
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setErrorMsg('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // User explicitly clicks "Analyse Shelf" to start AI vision processing
  const handleAnalyzeClick = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please capture or choose a shelf photo before analyzing.')
      return
    }
    await triggerAnalyze(selectedFile, previewUrl)
  }

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full space-y-3">
      {/* Hidden file input for Gallery / File Browser */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in shrink-0">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== TOP HEADER & CONTROLS ===================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
            New scan
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            AI Vision Scanner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Shelf Selector */}
          {configuredShelves.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">Target Shelf:</span>
              <select
                value={selectedShelfId}
                onChange={(e) => setSelectedShelfId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {configuredShelves.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {s.name} {s.aisle ? `(Aisle ${s.aisle})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* RECENT SCANS BUTTON */}
          <button
            type="button"
            onClick={() => setIsRecentScansModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer group"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Recent Scans</span>
            {recentScans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {recentScans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL WIDTH CAMERA & SCANNING CARD (Takes ALL Width of Content Area)       */}
      {/* ========================================================================= */}
      <div className="w-full flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-2xs flex flex-col justify-between overflow-hidden">
        {/* Full-Width Viewfinder Area with Cool Background & Laser Scan Animation */}
        <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[460px] md:min-h-[520px] rounded-xl overflow-hidden bg-[#050811] flex items-center justify-center border border-slate-800/90 shadow-2xl">
          {/* Ambient Sci-Fi Background Glows (Always Present) */}
          <div className="absolute inset-0 cool-scan-grid opacity-30 pointer-events-none"></div>
          <div className="absolute top-1/6 left-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-scanner-pulse"></div>
          <div className="absolute bottom-1/6 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-scanner-pulse"></div>

          {isAnalyzing ? (
            /* ================= STATE 1: ANALYZING STATE WITH SCAN ANIMATION ================= */
            <div className="relative w-full h-full min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-4 z-20">
              {/* Faster Laser Beam Sweeping during AI inference */}
              <div className="absolute inset-x-0 z-10 pointer-events-none animate-scan-laser-fast flex flex-col items-center">
                <div className="w-full h-16 sm:h-24 bg-gradient-to-b from-transparent via-cyan-500/10 to-cyan-500/25"></div>
                <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-300 to-transparent shadow-[0_0_15px_#38bdf8,0_0_30px_#818cf8]"></div>
                <div className="w-24 h-1 bg-cyan-300 rounded-full blur-[1px] -mt-0.5 shadow-[0_0_8px_#38bdf8]"></div>
              </div>

              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                </div>
                <div className="absolute -inset-2 rounded-2xl border border-dashed border-cyan-400/40 animate-spin-slow pointer-events-none"></div>
              </div>

              <div className="max-w-md">
                <h3 className="font-extrabold text-white text-base sm:text-lg">Analyzing shelf scan with AI...</h3>
                <p className="text-xs sm:text-sm text-cyan-300/80 mt-1.5 font-medium">
                  {analysisStatus || 'Computer vision engine detecting products, counts, and gaps'}
                </p>
              </div>
            </div>
          ) : isCameraActive ? (
            /* ================= STATE 2: LIVE CAMERA WITH LASER SCAN ANIMATION & HUD ================= */
            <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain sm:object-cover relative z-1"
              />

              {/* LASER SCANNING ANIMATION: Smooth Continuous Laser Beam Sweep */}
              <div className="absolute inset-x-0 z-10 pointer-events-none animate-scan-laser flex flex-col items-center">
                <div className="w-full h-16 sm:h-28 bg-gradient-to-b from-transparent via-indigo-500/10 to-indigo-500/30"></div>
                <div className="w-full h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-300 to-transparent shadow-[0_0_15px_#38bdf8,0_0_35px_#818cf8]"></div>
                <div className="w-28 h-1 bg-cyan-300 rounded-full blur-[1px] -mt-0.5 shadow-[0_0_10px_#38bdf8]"></div>
              </div>

              {/* Futuristic HUD Corner Reticles */}
              <div className="absolute inset-4 sm:inset-10 z-10 pointer-events-none">
                {/* Top-Left Corner */}
                <div className="absolute top-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-cyan-400/90 rounded-tl-lg shadow-[0_0_12px_rgba(56,189,248,0.5)]"></div>
                {/* Top-Right Corner */}
                <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-cyan-400/90 rounded-tr-lg shadow-[0_0_12px_rgba(56,189,248,0.5)]"></div>
                {/* Bottom-Left Corner */}
                <div className="absolute bottom-0 left-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-cyan-400/90 rounded-bl-lg shadow-[0_0_12px_rgba(56,189,248,0.5)]"></div>
                {/* Bottom-Right Corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-cyan-400/90 rounded-br-lg shadow-[0_0_12px_rgba(56,189,248,0.5)]"></div>

                {/* Center Target Reticle & Dashed Ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center animate-spin-slow">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]"></div>
                  </div>
                </div>

                {/* Bottom Shelf Guide Hint */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center">
                  <span className="text-white/60 text-[11px] font-mono font-semibold px-3 py-1 rounded-md bg-black/60 backdrop-blur-xs border border-white/10">
                    ALIGN SHELF HORIZONTALLY IN VIEW
                  </span>
                </div>
              </div>

              {/* Top Live Camera Badge */}
              <div className="absolute top-3.5 left-3.5 z-20 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="tracking-wider text-cyan-300 font-mono">LIVE AI VISION</span>
              </div>

              {/* Camera Header Actions */}
              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-xs transition-transform active:scale-90 cursor-pointer shadow-md"
                  title="Switch Camera (Front/Rear)"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-300" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  title="Close Camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            /* ================= STATE 3: PHOTO PREVIEW WITH HUD FRAME ================= */
            <div className="relative w-full h-full bg-[#050811] flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt="Shelf Scan Preview"
                className="w-full h-full object-contain relative z-1"
              />

              {/* Corner Reticles Frame */}
              <div className="absolute inset-4 sm:inset-8 z-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-lg shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-lg shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-lg shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400/80 rounded-br-lg shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>
              </div>

              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3.5 left-3.5 z-20 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Photo captured · Click &ldquo;Analyse Shelf&rdquo; to start AI detection</span>
              </div>
            </div>
          ) : (
            /* ================= STATE 4: IDLE / COOL SCI-FI BG WITH APERTURE ================= */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => galleryInputRef.current?.click()}
              className="relative w-full h-full min-h-0 p-6 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all group z-10 overflow-hidden"
            >
              {/* Glowing Aperture Icon */}
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-all flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
                  <Camera className="w-10 h-10 stroke-[1.8] text-cyan-300 group-hover:text-white transition-colors" />
                </div>
                {/* Rotating Dashed Accent Ring */}
                <div className="absolute -inset-2 rounded-3xl border border-dashed border-indigo-500/30 group-hover:border-cyan-400/50 animate-spin-slow pointer-events-none"></div>
              </div>

              <p className="font-extrabold text-white text-lg sm:text-xl mb-1.5 tracking-tight">
                AI Vision Shelf Scanner
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-md font-medium">
                Align shelf straight in frame with live camera, or upload a photo to detect products, counts, and gaps.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    startCamera()
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                >
                  <Camera className="w-4 h-4 text-cyan-300" />
                  <span>Launch Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    galleryInputRef.current?.click()
                  }}
                  className="bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
                >
                  <ImageIcon className="w-4 h-4 text-slate-300" />
                  <span>Browse gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {isCameraActive ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Align shelf in frame and click &ldquo;Take Photo&rdquo;.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4 text-white" />
                  <span>Take Photo</span>
                </button>
              </div>
            </>
          ) : previewUrl ? (
            <>
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate max-w-[200px]">
                  {selectedFile?.name || 'shelf_capture.jpg'}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">· Ready</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleClearImage()
                    startCamera()
                  }}
                  disabled={isAnalyzing}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeClick}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Analyse Shelf</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                JPG, PNG or WEBP up to 20 MB · Real-time AI vision detection
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm border border-slate-200/80 dark:border-slate-800 cursor-not-allowed flex items-center gap-2 select-none opacity-60"
                  title="Capture or upload a shelf photo first"
                >
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Analyse</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECENT SCANS MODAL                                                        */}
      {/* ========================================================================= */}
      {isRecentScansModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in"
          onClick={() => setIsRecentScansModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
                  <ScanIcon className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Recent Scans
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {recentScans.length} {recentScans.length === 1 ? 'scan' : 'scans'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Click any scan to inspect parallel photos, detected counts, and gaps
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecentScansModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scans List / Table */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Loading scan history...</span>
                </div>
              ) : recentScans.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-1">
                    <ScanIcon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No recent scans recorded</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Take a shelf photo with the camera to run your first visual scan.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((scan) => {
                    const gapsCount = scan.empty_gaps_count ?? scan.gaps ?? 0
                    const itemsCount = scan.total_detected_count ?? scan.items ?? 0
                    const thumbUrl = scan.annotated_image_url || scan.raw_image_url

                    return (
                      <div
                        key={scan.id}
                        onClick={() => {
                          setIsRecentScansModalOpen(false)
                          if (onSelectScan) onSelectScan(scan)
                        }}
                        className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        {/* Thumbnail & Shelf Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-10 rounded-lg bg-slate-900/10 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              <img
                                src={`https://ai-vs-scanner-be.aiiotgeeks.tech${thumbUrl.startsWith('/') ? '' : '/'}${thumbUrl}`}
                                alt="Shelf thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <ScanIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {scan.shelf || scan.shelf_id || 'Shelf Section'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 truncate">
                                {scan.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span>{scan.time || scan.date || 'Today'}</span>
                              <span>·</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {itemsCount} items
                              </span>
                              {gapsCount > 0 ? (
                                <>
                                  <span>·</span>
                                  <span className="text-rose-600 font-bold">{gapsCount} gaps</span>
                                </>
                              ) : (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-600 font-semibold">0 gaps</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            Verified
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionModalScan(scan)
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsRecentScansModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== THREE-DOTS ACTIONS MODAL ==================== */}
      {actionModalScan && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {actionModalScan.shelf || actionModalScan.shelf_id || 'Shelf Section'}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {actionModalScan.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionModalScan(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  const targetScan = actionModalScan
                  setActionModalScan(null)
                  setIsRecentScansModalOpen(false)
                  if (onSelectScan) onSelectScan(targetScan)
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ScanIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    View Scan Results & Parallel Photos
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Inspect AI bounding boxes, shelf counts, and gaps
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (actionModalScan?.id) {
                    navigator.clipboard?.writeText(actionModalScan.id)
                    showToast(`Scan ID "${actionModalScan.id}" copied!`, 'success')
                    setActionModalScan(null)
                  }
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                  <Copy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Copy Scan ID
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {actionModalScan.id}
                  </p>
                </div>
              </button>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActionModalScan(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  )
}
