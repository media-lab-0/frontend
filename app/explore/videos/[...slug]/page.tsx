"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, Loader2, Play, ExternalLink, AlertCircle } from 'lucide-react'

function VideoPlayer() {
  const searchParams = useSearchParams()
  const videoUrl = searchParams.get('url') || ''
  
  const [videoData, setVideoData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Get source and id from the URL path
  const pathParts = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').filter(Boolean) 
    : []
  const source = pathParts[2] || 'letsjerktv'
  const videoId = pathParts[3] || ''

  useEffect(() => {
    if (!videoUrl && !videoId) return
    setIsLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (videoUrl) params.append('url', videoUrl)
    if (source) params.append('source', source)
    if (videoId) params.append('id', videoId)

    fetch(`/api/videos/stream?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setVideoData(data)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [videoUrl, videoId, source])

  // Extract fields from API response
  const embedUrl = videoData?.embed_url || videoData?.iframe_src || null
  const streamUrl = videoData?.stream_url || videoData?.video_url || null
  const title = videoData?.title || 'Loading video...'
  const thumbnail = videoData?.thumbnail || ''
  const tags = videoData?.tags || []
  const categories = videoData?.categories || []
  const relatedVideos = videoData?.related_videos || []

  return (
    <div className="flex-1 flex flex-col gap-6 w-full max-w-[1600px] mx-auto px-2 md:px-4 py-6 bg-background min-h-screen">
      
      {/* Back */}
      <Link 
        href="/explore/videos"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Videos
      </Link>

      {/* Player Area — Full Width, fits viewport */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl w-full max-h-[75vh]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm text-red-400 font-bold text-center">{error}</p>
            {videoUrl && (
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open Original
              </a>
            )}
          </div>
        )}

        {!isLoading && !error && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
          />
        )}

        {!isLoading && !error && !embedUrl && streamUrl && (
          <video
            src={streamUrl}
            controls
            autoPlay
            className="w-full h-full"
            poster={thumbnail}
          >
            Your browser does not support video playback.
          </video>
        )}

        {!isLoading && !error && !embedUrl && !streamUrl && videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <Play className="w-12 h-12 text-white/30" />
            <p className="text-sm text-muted-foreground font-bold">Unable to extract stream</p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Watch on Source Site
            </a>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex flex-col gap-3">
        <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">
          {title}
        </h1>

        {(tags.length > 0 || categories.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat: string, i: number) => (
              <Link
                key={`cat-${i}`}
                href={`/explore/videos?category=${encodeURIComponent(cat.toLowerCase())}`}
                className="px-2.5 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded border border-pink-500/20 transition-all"
              >
                {cat}
              </Link>
            ))}
            {tags.map((tag: string, i: number) => (
              <Link
                key={`tag-${i}`}
                href={`/explore/videos?q=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground text-[10px] font-bold rounded border border-muted/10 transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Related Videos — Below player in a grid */}
      {relatedVideos.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-muted/20 pt-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
            Related Videos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {relatedVideos.map((vid: any, i: number) => (
              <Link
                key={`rel-${i}`}
                href={`/explore/videos/letsjerktv/${vid.id || i}?url=${encodeURIComponent(vid.url || vid.video_link || '')}`}
                className="group flex flex-col bg-muted/10 hover:bg-muted/20 rounded-lg overflow-hidden transition-all border border-transparent hover:border-muted/20"
              >
                <div className="relative aspect-video bg-muted/20 overflow-hidden">
                  {vid.thumbnail ? (
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                  {vid.duration && (
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 rounded text-[8px] font-bold text-white">
                      {vid.duration}
                    </div>
                  )}
                  {vid.quality && (
                    <div className="absolute top-1 left-1 px-1 py-0.5 bg-pink-600/80 rounded text-[7px] font-black text-white">
                      {vid.quality}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-pink-600/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 p-2.5">
                  <span className="text-[11px] font-bold text-foreground/80 leading-tight line-clamp-2">
                    {vid.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VideoPlayerPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    }>
      <VideoPlayer />
    </Suspense>
  )
}
