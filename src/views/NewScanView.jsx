import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Scan,
  Check,
} from 'lucide-react'

export default function NewScanView({
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

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment') // 'environment' (back) | 'user' (front)

  const galleryInputRef = useRef(null)
  const streamRef = useRef(null)
  const mobileVideoRef = useRef(null)
  const desktopVideoRef = useRef(null)

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

  // Submit scan to AI backend
  const triggerAnalyze = async (fileToUpload, localPreview) => {
    setIsAnalyzing(true)
    setErrorMsg('')
    setAnalysisStatus('Uploading photo to AI shelf vision engine (POST /api/scans)...')

    try {
      await onScanComplete({
        file: fileToUpload,
        previewUrl: localPreview,
        shelfName: shelfName.trim() || 'Shelf Section 1',
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

  // Step 1: Capture frame from active video stream into File + Preview (Separated from Analyse)
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

  // File picker handler (Gallery / File Explorer) -> loads preview for user review before analyzing
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

  // Drag and drop handlers -> loads preview for user review before analyzing
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

  // Step 2: User explicitly clicks "Analyse Shelf" to start AI vision processing
  const handleAnalyzeClick = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMsg('Please capture or choose a shelf photo before analyzing.')
      return
    }
    await triggerAnalyze(selectedFile, previewUrl)
  }

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full">
      {/* Hidden file input for Gallery / File Browser */}
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {errorMsg && (
        <div className="p-3.5 mb-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in shrink-0">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================== MOBILE LAYOUT ===================== */}
      <div className="md:hidden space-y-3 flex-1 flex flex-col min-h-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none shrink-0">
          New scan
        </h1>

        {/* Mobile Viewfinder: Live Camera OR Image Preview OR Placeholder */}
        <div className="relative bg-slate-950 rounded-md aspect-[4/3] flex items-center justify-center text-center shadow-lg border border-slate-800 overflow-hidden shrink-0">
          {isCameraActive ? (
            <div className="relative w-full h-full bg-black">
              <video
                ref={mobileVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                LIVE CAMERA
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-md bg-slate-900/80 text-white border border-white/20 active:scale-90 transition-transform cursor-pointer"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-md bg-slate-900/80 text-white border border-white/20 active:scale-90 transition-transform cursor-pointer"
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
                className="w-full h-full object-contain bg-slate-950"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-900/80 text-white hover:bg-slate-900 border border-white/20 transition-all cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-white/20">
                Photo captured · Tap &ldquo;Analyse Shelf&rdquo; below
              </div>
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-blue-400/60 rounded-md m-3 flex flex-col items-center justify-center p-4">
              <Camera className="w-8 h-8 text-blue-400 mb-2 stroke-[1.8]" />
              <p className="text-white/90 text-sm font-semibold tracking-wide">
                Fit shelf straight on in frame
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-md text-xs border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Gallery
                </button>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Open Camera
                </button>
              </div>
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

        {/* Mobile Camera Controls: SEPARATE Take Photo vs. Analyse Button */}
        <div className="pt-1 flex items-center justify-between gap-3 shrink-0">
          {isCameraActive ? (
            <>
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-2.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-2.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Take Photo</span>
              </button>
            </>
          ) : previewUrl ? (
            <>
              <button
                type="button"
                onClick={() => {
                  handleClearImage()
                  startCamera()
                }}
                disabled={isAnalyzing}
                className="flex-1 py-2.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
                className="flex-2 py-2.5 px-4 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Analyse</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2.5 px-4 rounded-md bg-slate-100 text-slate-400 border border-slate-200/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
            >
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>Analyse</span>
            </button>
          )}
        </div>

        {/* Mobile Recent Scans Table */}
        <div className="bg-white rounded-md border border-slate-200/90 p-3.5 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <Scan className="w-3.5 h-3.5 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900">Recent Scans</h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {recentScans.length} {recentScans.length === 1 ? 'scan' : 'scans'}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pt-2 space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading recent scans...</span>
              </div>
            ) : recentScans.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No recent scans recorded yet.
              </div>
            ) : (
              recentScans.map((scan) => {
                const gapsCount = scan.empty_gaps_count ?? scan.gaps ?? 0
                const itemsCount = scan.total_detected_count ?? scan.items ?? 0

                return (
                  <div
                    key={scan.id}
                    onClick={() => onSelectScan && onSelectScan(scan)}
                    className="p-2.5 rounded-md border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 active:scale-98 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {scan.shelf || scan.shelf_id || 'Shelf Section'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        <span>{scan.time || scan.date || 'Today'}</span>
                        <span>·</span>
                        <span>{itemsCount} items</span>
                        {gapsCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-rose-600 font-bold">{gapsCount} gaps</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[2.5]" />
                        Verified
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT (Appears fully in screen, Y = 72px baseline) ===================== */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 space-y-2.5 w-full">
        {/* Header matching exact Sidebar logo height */}
        <div className="flex items-center justify-between shrink-0 h-10">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
            New scan
          </h1>
        </div>

        {/* 2-Column Grid filling 100% of available height within the viewport */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5 items-stretch">
          {/* Left Column (7 cols): Camera / Preview / Upload Card */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-7 bg-white rounded-md border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between h-full min-h-0 overflow-hidden">
            {/* Viewfinder Area */}
            <div className="flex-1 min-h-0 flex flex-col justify-center relative">
              {isAnalyzing ? (
                /* Analyzing State */
                <div className="w-full h-full min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-md bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center animate-pulse shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-black text-slate-900 text-base">Analyzing shelf scan with AI...</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {analysisStatus || 'Computer vision engine detecting products, counts, and gaps'}
                    </p>
                  </div>
                </div>
              ) : isCameraActive ? (
                /* Live Camera Stream Interface */
                <div className="relative w-full h-full min-h-0 rounded-md overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
                  <video
                    ref={desktopVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  {/* Top Live Camera Overlay Bar */}
                  <div className="absolute top-3.5 left-3.5 bg-blue-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    LIVE CAMERA
                  </div>
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                      title="Switch Camera (Front/Rear)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-2 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : previewUrl ? (
                /* Captured / Uploaded Photo Preview */
                <div className="relative w-full h-full min-h-0 rounded-md overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Shelf Scan Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-3.5 right-3.5 p-2 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3.5 left-3.5 bg-slate-900/85 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-md border border-white/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Photo captured · Click &ldquo;Analyse Shelf&rdquo; to start AI detection</span>
                  </div>
                </div>
              ) : (
                /* Initial State: Drag and drop or Choose Camera / Gallery */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full h-full min-h-0 border-2 border-dashed border-blue-400/80 rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/20 transition-colors"
                >
                  <div className="w-14 h-14 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5 shadow-2xs">
                    <Camera className="w-7 h-7 stroke-[1.8]" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Drag and drop a shelf photo, or choose an option
                  </p>
                  <p className="text-xs text-slate-400 mb-5">JPG, PNG or WEBP up to 20 MB</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        galleryInputRef.current?.click()
                      }}
                      className="bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-2xs active:scale-98"
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      Open Camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Bar: SEPARATED Take Photo vs. Analyse Button */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              {isCameraActive ? (
                <>
                  <span className="text-xs text-slate-500 font-medium truncate">
                    Align shelf in frame and click &ldquo;Take Photo&rdquo;.
                  </span>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all"
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
                    <span className="text-xs text-slate-700 font-semibold truncate max-w-[200px]">
                      {selectedFile?.name || 'shelf_capture.jpg'}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">· Ready</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleClearImage()
                        startCamera()
                      }}
                      disabled={isAnalyzing}
                      className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyzeClick}
                      disabled={isAnalyzing}
                      className="px-5 py-2 rounded-md bg-[#5956c6] hover:bg-[#4d4ab5] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>Analyse</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-400 font-medium">
                    No photo captured yet. Choose an option to start.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2 rounded-md bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm border border-slate-200/80 cursor-not-allowed flex items-center gap-2 select-none opacity-60"
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

          {/* Right Column (5 cols): Recent Scans Table */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-5 bg-white rounded-md border border-slate-200/90 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
            {/* Table Card Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
                  <Scan className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                    Recent Scans
                  </h2>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                {recentScans.length} {recentScans.length === 1 ? 'scan' : 'scans'}
              </span>
            </div>

            {/* Table Body with In-Table Scrolling */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Loading scan history...</span>
                </div>
              ) : recentScans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                  <div className="w-12 h-12 rounded-md bg-slate-50 text-slate-400 flex items-center justify-center mb-2.5 border border-slate-100">
                    <Scan className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <p className="font-bold text-slate-700 text-xs">No recent scans recorded</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                    Capture or upload a shelf photo to run your first visual AI scan.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider shadow-2xs">
                    <tr>
                      <th className="px-4 py-2.5 bg-slate-50">Shelf / ID</th>
                      <th className="px-3 py-2.5 bg-slate-50 text-center">Items &amp; Gaps</th>
                      <th className="px-3 py-2.5 bg-slate-50 text-right">Time</th>
                      <th className="px-4 py-2.5 bg-slate-50 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentScans.map((scan) => {
                      const gapsCount = scan.empty_gaps_count ?? scan.gaps ?? 0
                      const itemsCount = scan.total_detected_count ?? scan.items ?? 0

                      return (
                        <tr
                          key={scan.id}
                          onClick={() => onSelectScan && onSelectScan(scan)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          title="Click to view scan results and visual detections"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[130px] sm:max-w-[170px]">
                                {scan.shelf || scan.shelf_id || 'Shelf Section'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                {scan.id}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                              </span>
                              {gapsCount > 0 ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                  {gapsCount} {gapsCount === 1 ? 'gap' : 'gaps'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                  0 gaps
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-right">
                            <span className="text-slate-500 font-medium whitespace-nowrap text-[11px]">
                              {scan.time || scan.date || 'Today'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                                Verified
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
