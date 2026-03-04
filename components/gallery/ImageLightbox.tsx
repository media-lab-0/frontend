"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  Maximize, Minimize, ZoomIn, ZoomOut, Heart 
} from "lucide-react"

interface Image {
  id: string
  url: string
}

interface ImageLightboxProps {
  images: Image[]
  initialIndex: number
  onClose: () => void
  galleryTitle: string
}

export default function ImageLightbox({ images, initialIndex, onClose, galleryTitle }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === " ") {
        e.preventDefault()
        setIsPlaying(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, handleNext, handlePrev])

  // Slideshow timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(handleNext, 3000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
       if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, handleNext])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle click outside to close (on the dark backdrop)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none touch-none animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 pointer-events-none">
        {/* Left: Counter */}
        <div className="text-white/90 text-sm font-black tracking-tighter px-3 py-1 bg-black/40 rounded-full border border-white/10 backdrop-blur-md pointer-events-auto">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full transition-colors ${isLiked ? 'text-pink-500 bg-pink-500/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button 
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-red-500 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content: Image & Nav */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Previous Button */}
        <button 
          onClick={handlePrev}
          className="absolute left-4 z-20 p-4 text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all group"
        >
          <ChevronLeft size={48} strokeWidth={1} className="transition-transform group-hover:-translate-x-1" />
        </button>

        {/* Current Image */}
        <div className="relative transition-all duration-500 flex items-center justify-center w-full h-full overflow-hidden">
          <img 
            key={images[currentIndex].url}
            src={images[currentIndex].url} 
            alt={`Image ${currentIndex + 1}`}
            className={`w-full h-full object-contain transition-all duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {/* Next Button */}
        <button 
          onClick={handleNext}
          className="absolute right-4 z-20 p-4 text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all group"
        >
          <ChevronRight size={48} strokeWidth={1} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Footer: Attribution */}
      <div className="absolute bottom-4 left-0 right-0 p-4 flex flex-col items-center justify-center pointer-events-none opacity-50">
        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Brought by</span>
        <span className="text-pink-600 text-sm font-black tracking-tighter uppercase italic">Antigravity</span>
      </div>
    </div>
  )
}
