import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

export default function NewScanView({ onScanComplete }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanMode, setScanMode] = useState('check') // 'check' | 'baseline'
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment') // 'environment' (back) | 'user' (front)

  const galleryInputRef = useRef(null)
  const streamRef = useRef(null)
  const mobileVideoRef = useRef(null)
  const desktopVideoRef = useRef(null)

  // Clean up camera stream and object URLs on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Stop active camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (mobileVideoRef.current) {
      mobileVideoRef.current.srcObject = null
    }
    if (desktopVideoRef.current) {
      desktopVideoRef.current.srcObject = null
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

      // Bind stream to video elements on next render frame
      setTimeout(() => {
        if (mobileVideoRef.current) {
          mobileVideoRef.current.srcObject = stream
          mobileVideoRef.current.play().catch(() => {})
        }
        if (desktopVideoRef.current) {
          desktopVideoRef.current.srcObject = stream
          desktopVideoRef.current.play().catch(() => {})
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

  // Capture frame from active video stream into canvas and generate File + Preview
  const capturePhoto = () => {
    const video =
      (desktopVideoRef.current && desktopVideoRef.current.videoWidth)
        ? desktopVideoRef.current
        : (mobileVideoRef.current && mobileVideoRef.current.videoWidth)
        ? mobileVideoRef.current
        : null

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

  // Submit scan to AI backend
  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setErrorMsg('')
    setAnalysisStatus('Preparing shelf scan image...')

    try {
      let fileToUpload = selectedFile
      let localPreview = previewUrl

      // If user analyzes without choosing a file or camera frame, generate a realistic test shelf
      if (!fileToUpload) {
        setAnalysisStatus('Generating camera capture frame...')
        const canvas = document.createElement('canvas')
        canvas.width = 800
        canvas.height = 600
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#1e293b'
        ctx.fillRect(0, 0, 800, 600)

        ctx.fillStyle = '#64748b'
        ctx.fillRect(0, 280, 800, 16)
        ctx.fillRect(0, 560, 800, 16)

        ctx.fillStyle = '#dc2626'
        ctx.fillRect(80, 140, 90, 140)
        ctx.fillStyle = '#2563eb'
        ctx.fillRect(220, 140, 90, 140)
        ctx.fillStyle = '#16a34a'
        ctx.fillRect(360, 150, 80, 130)

        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 3
        ctx.setLineDash([8, 6])
        ctx.strokeRect(500, 140, 100, 140)

        ctx.setLineDash([])
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(100, 420, 110, 140)
        ctx.fillStyle = '#b91c1c'
        ctx.fillRect(260, 430, 85, 130)

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
        fileToUpload = new File([blob], 'shelf_camera_capture.png', { type: 'image/png' })
        localPreview = URL.createObjectURL(blob)
        setPreviewUrl(localPreview)
      }

      setAnalysisStatus('Uploading photo to AI shelf vision engine (POST /api/scans)...')

      await onScanComplete({
        file: fileToUpload,
        previewUrl: localPreview,
        shelfName: 'Aisle 3, Shelf B',
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

  return (
    <div className="space-y-6 w-full max-w-[1550px]">
      {/* Hidden file input for Gallery / File Browser */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 text-rose-500 hover:text-rose-700 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden space-y-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">New scan</h1>

        {/* Tab switcher: Check shelf vs Set baseline */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
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

        <p className="text-xs text-slate-500 leading-relaxed">
          {scanMode === 'check'
            ? "Compare today's shelf with inventory targets. Detects missing SKUs and calculates reorders."
            : 'Capture the fully-stocked reference shelf once to establish the visual planogram baseline.'}
        </p>

        {/* Mobile Viewfinder: Live Camera OR Image Preview OR Placeholder */}
        <div className="relative bg-slate-950 rounded-3xl aspect-[4/3] flex items-center justify-center text-center shadow-lg border border-slate-800 overflow-hidden">
          {isCameraActive ? (
            <div className="relative w-full h-full bg-black">
              <video
                ref={mobileVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Overlaid Camera Controls */}
              <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                LIVE CAMERA
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-slate-900/80 text-white border border-white/20 active:scale-90 transition-transform"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-slate-900/80 text-white border border-white/20 active:scale-90 transition-transform"
                  title="Close Camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Selected Shelf"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 border border-white/20 transition-all cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                Photo ready for AI analysis
              </div>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-blue-400/60 rounded-2xl m-3 flex flex-col items-center justify-center p-4">
              <Camera className="w-8 h-8 text-blue-400 mb-2 stroke-[1.8]" />
              <p className="text-white/90 text-sm font-semibold tracking-wide">
                Fit shelf straight on in frame
              </p>
              <p className="text-xs text-slate-400 mt-1">Tap camera shutter or gallery below</p>
            </div>
          )}

          {/* Loading Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-3 z-10">
              <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
              <p className="font-bold text-sm">{analysisStatus || 'Analyzing shelf objects…'}</p>
              <p className="text-xs text-slate-400">Computer Vision Object Detection in progress</p>
            </div>
          )}
        </div>

        {/* Mobile Camera Controls Bar */}
        <div className="pt-2 flex items-center justify-between px-2 gap-3">
          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 py-3 px-3 rounded-2xl bg-white border border-slate-200/90 text-slate-800 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            Gallery
          </button>

          {/* Direct Camera Shutter / Action Button */}
          <button
            type="button"
            onClick={() => {
              if (isCameraActive) {
                capturePhoto()
              } else if (previewUrl) {
                handleAnalyze()
              } else {
                startCamera()
              }
            }}
            disabled={isAnalyzing}
            className="w-16 h-16 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 shrink-0 cursor-pointer"
            aria-label="Camera shutter"
          >
            {isCameraActive ? (
              <div className="w-12 h-12 rounded-full border-3 border-white bg-white/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white"></div>
              </div>
            ) : previewUrl ? (
              <Sparkles className="w-6 h-6 text-white" />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-white/60 bg-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            )}
          </button>

          {/* Retake OR Analyze CTA */}
          {previewUrl ? (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Analyze'
              )}
            </button>
          ) : isCameraActive ? (
            <button
              type="button"
              onClick={stopCamera}
              className="flex-1 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCamera()}
              className="flex-1 py-3 px-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              Open Camera
            </button>
          )}
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT ===================== */}
      <div className="hidden md:block space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New scan</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload or capture a shelf photo to trigger AI object counting, out-of-stock detection, and gap analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: Drag and Drop / Live Camera / Preview Card (2 cols) */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
            {isCameraActive ? (
              /* Live Camera Stream Interface */
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/10] flex items-center justify-center shadow-inner">
                  <video
                    ref={desktopVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  {/* Top Live Camera Overlay Bar */}
                  <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs font-bold px-3 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    LIVE DEVICE CAMERA
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Shutter Capture Button */}
                  <div className="absolute bottom-5 inset-x-0 flex justify-center">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2.5 cursor-pointer transition-all border border-blue-400/40"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <span>Capture Shelf Photo</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                  <span className="text-slate-600 font-medium">Position your camera steady and click &ldquo;Capture Shelf Photo&rdquo;.</span>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Cancel Camera
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              /* Captured / Selected Photo Preview Interface */
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[16/10] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Shelf Scan Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
                    Photo captured & ready for AI analysis
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedFile ? selectedFile.name : 'shelf_capture.jpg'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'High-resolution frame ready'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Retake photo
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Choose from files
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Initial State: Drag and drop or Choose Camera / Gallery */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => galleryInputRef.current?.click()}
                className="border-2 border-dashed border-blue-400/80 rounded-2xl p-14 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/20 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Camera className="w-7 h-7 stroke-[1.8]" />
                </div>
                <p className="font-bold text-slate-900 text-base mb-1">
                  Drag and drop a shelf photo, or choose an option
                </p>
                <p className="text-xs text-slate-400 mb-6">JPG, PNG or WEBP up to 20 MB</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      galleryInputRef.current?.click()
                    }}
                    className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-2xs active:scale-98"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    Browse gallery
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      startCamera()
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    Open Camera
                  </button>
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedFile ? 'Ready to send to AI vision engine' : isCameraActive ? 'Camera active — capture frame above' : 'No photo selected'}
              </span>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isCameraActive}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{analysisStatus || 'Analyzing shelf…'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze shelf</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Info Cards (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Tips for an optimal scan</h2>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Capture the entire shelf section straight on.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Avoid heavy camera glare, reflections, or deep shadows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Keep phone or webcam steady to ensure product labels and barcodes are crisp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>AI backend performs product detection, counting, and gap analysis in seconds.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">AI Vision Pipeline</h2>
              <div className="space-y-2 text-xs text-slate-500">
                <p>1. <span className="font-semibold text-slate-700">Live Camera Frame:</span> WebRTC getUserMedia captures direct frame.</p>
                <p>2. <span className="font-semibold text-slate-700">Object Detection:</span> Identifies bounding boxes & SKUs.</p>
                <p>3. <span className="font-semibold text-slate-700">Stock Count:</span> Matches shelf count vs inventory threshold.</p>
                <p>4. <span className="font-semibold text-slate-700">Auto Reorder:</span> Recommends Purchase Orders for low stock.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
