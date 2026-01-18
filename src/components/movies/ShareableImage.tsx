import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Share2 } from "lucide-react";
import { Movie } from "@/types/movie";
import { toast } from "sonner";

interface ShareableImageProps {
  movie: Movie;
  children?: React.ReactNode;
}

// Helper to convert image URL to base64 via server-side API (bypasses CORS/tainted canvas)
const imageToBase64 = async (url: string): Promise<string> => {
  try {
    // Call our serverless API endpoint to fetch image server-side
    // In production: uses Vercel serverless function
    // In dev: requires 'vercel dev' to be running, or falls back to CORS proxy
    const apiUrl = `/api/image-to-base64?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.base64) {
      return data.base64;
    }
    throw new Error("No base64 data in response");
  } catch (error) {
    console.warn("Server-side API failed, trying CORS proxy fallback:", error);
    
    // Fallback: Use CORS proxy for local development when API isn't available
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const proxyResponse = await fetch(proxyUrl);
      
      if (proxyResponse.ok) {
        const blob = await proxyResponse.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (proxyError) {
      console.error("CORS proxy also failed:", proxyError);
    }
    
    // Last resort: return original URL (will cause tainted canvas warning but won't crash)
    console.warn("Using original URL - canvas may be tainted");
    return url;
  }
};

export function ShareableImage({ movie, children }: ShareableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [backdropBase64, setBackdropBase64] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert images to base64 when dialog opens to avoid CORS/tainted canvas issues
  useEffect(() => {
    if (isOpen) {
      setImagesLoaded(false);
      const loadImages = async () => {
        try {
          const promises: Promise<string | null>[] = [];
          
          if (movie.posterUrl) {
            promises.push(imageToBase64(movie.posterUrl));
          } else {
            promises.push(Promise.resolve(null));
          }
          
          if (movie.backdropUrl) {
            promises.push(imageToBase64(movie.backdropUrl));
          } else {
            promises.push(Promise.resolve(null));
          }
          
          // Wait max 5 seconds for images
          const [poster, backdrop] = await Promise.race([
            Promise.all(promises),
            new Promise<[string | null, string | null]>(resolve => 
              setTimeout(() => resolve([null, null]), 5000)
            )
          ]) as [string | null, string | null];
          
          setPosterBase64(poster || movie.posterUrl || null);
          setBackdropBase64(backdrop || movie.backdropUrl || null);
          
          // Small delay to ensure DOM is updated
          setTimeout(() => setImagesLoaded(true), 200);
        } catch (error) {
          console.error("Failed to load images:", error);
          // Fallback to original URLs
          setPosterBase64(movie.posterUrl || null);
          setBackdropBase64(movie.backdropUrl || null);
          setImagesLoaded(true);
        }
      };
      
      loadImages();
    } else {
      setImagesLoaded(false);
      setPosterBase64(null);
      setBackdropBase64(null);
    }
  }, [isOpen, movie.posterUrl, movie.backdropUrl]);

  const exportImage = async () => {
    if (!canvasRef.current || !imagesLoaded) {
      toast.error("Please wait for images to load");
      return;
    }

    setIsExporting(true);
    try {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(canvasRef.current, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true, // Use CORS since we converted to base64
        allowTaint: false, // No taint needed with base64 images
        backgroundColor: "#000000",
        logging: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Replace images with base64 versions in cloned document
          const clonedElement = clonedDoc.querySelector('[data-shareable-preview]') as HTMLElement;
          if (clonedElement) {
            const posterImg = clonedElement.querySelector('[data-poster-img]') as HTMLImageElement;
            const backdropDiv = clonedElement.querySelector('[data-backdrop]') as HTMLElement;
            
            if (posterImg && posterBase64) {
              posterImg.src = posterBase64;
              posterImg.crossOrigin = "anonymous";
            }
            
            if (backdropDiv && backdropBase64) {
              backdropDiv.style.backgroundImage = `url(${backdropBase64})`;
            }
          }
        },
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${movie.title.replace(/[^a-z0-9]/gi, "_")}-story-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Image exported successfully!");
      }, "image/png");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current || !imagesLoaded) {
      toast.error("Please wait for images to load");
      return;
    }

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(canvasRef.current, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#000000",
        logging: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-shareable-preview]') as HTMLElement;
          if (clonedElement) {
            const posterImg = clonedElement.querySelector('[data-poster-img]') as HTMLImageElement;
            const backdropDiv = clonedElement.querySelector('[data-backdrop]') as HTMLElement;
            
            if (posterImg && posterBase64) {
              posterImg.src = posterBase64;
              posterImg.crossOrigin = "anonymous";
            }
            
            if (backdropDiv && backdropBase64) {
              backdropDiv.style.backgroundImage = `url(${backdropBase64})`;
            }
          }
        },
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${movie.title.replace(/[^a-z0-9]/gi, "_")}-story.png`, { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Check out ${movie.title}`,
              text: note || `Loving ${movie.title}!`,
              files: [file],
            });
            toast.success("Shared successfully!");
          } catch (error: any) {
            if (error.name !== "AbortError") {
              toast.error("Failed to share");
            }
          }
        } else {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            toast.success("Image copied to clipboard!");
          } catch (clipboardError) {
            exportImage();
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Create Story
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Create Shareable Story</DialogTitle>
          <DialogDescription>
            Customize your movie story image for social media (9:16 ratio)
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="flex justify-center bg-gradient-to-br from-black/80 to-black/50 p-6 rounded-lg border-2 border-border/50">
            <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-lg overflow-hidden shadow-2xl bg-black">
              <div 
                className="absolute inset-0 origin-top-left"
                style={{ 
                  transform: "scale(0.25)",
                  width: "1080px",
                  height: "1920px",
                }}
              >
                <ShareableImagePreview
                  ref={canvasRef}
                  movie={movie}
                  note={note}
                  posterBase64={posterBase64}
                  backdropBase64={backdropBase64}
                />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add a note (optional)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Loving ${movie.title}...`}
              maxLength={200}
              className="min-h-[80px] resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {note.length}/200
            </p>
          </div>

          {/* Loading indicator */}
          {!imagesLoaded && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading images...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={exportImage}
              disabled={isExporting || !imagesLoaded}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Download"}
            </Button>
            <Button
              onClick={handleShare}
              disabled={isExporting || !imagesLoaded}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ShareableImagePreview = React.forwardRef<
  HTMLDivElement,
  { movie: Movie; note: string; posterBase64: string | null; backdropBase64: string | null }
>(({ movie, note, posterBase64, backdropBase64 }, ref) => {
  return (
    <div
      ref={ref}
      data-shareable-preview
      className="relative bg-black text-white overflow-hidden"
      style={{
        width: "1080px",
        height: "1920px",
        fontFamily: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
      }}
    >
      {/* Deep black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Subtle backdrop for depth (very subtle) */}
      {(backdropBase64 || movie.backdropUrl) && (
        <div
          data-backdrop
          className="absolute inset-0 opacity-[0.08] z-0"
          style={{
            backgroundImage: `url(${backdropBase64 || movie.backdropUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) brightness(0.2)",
          }}
        />
      )}

      {/* Soft vignette overlay */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* Subtle film grain */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
          mixBlendMode: "overlay",
        }}
      />

      {/* Content - Centered floating poster */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-20">
        {/* Floating central poster */}
        <div className="flex justify-center mb-16">
          {(posterBase64 || movie.posterUrl) ? (
            <div 
              className="relative"
              style={{
                filter: "drop-shadow(0 0 80px rgba(59, 130, 246, 0.3)) drop-shadow(0 0 40px rgba(251, 191, 36, 0.2))",
              }}
            >
              <img
                data-poster-img
                src={posterBase64 || movie.posterUrl || ""}
                alt={movie.title}
                className="w-[520px] h-[780px] object-cover"
                style={{
                  boxShadow: "0 0 120px rgba(0,0,0,0.8), inset 0 0 60px rgba(59, 130, 246, 0.1)",
                }}
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Cool blue shadow / warm highlight overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, transparent 50%, rgba(251, 191, 36, 0.1) 100%)",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          ) : (
            <div className="w-[520px] h-[780px] bg-gradient-to-br from-slate-900/50 to-black flex items-center justify-center border border-white/5">
              <span className="text-4xl font-serif text-center px-12 text-white/40 tracking-wider">
                {movie.title}
              </span>
            </div>
          )}
        </div>

        {/* Lower third - Title in warm gold */}
        <div className="absolute bottom-0 left-0 right-0 pb-32 px-20">
          <div className="text-center space-y-4">
            {/* Year (subtle, above title) */}
            {movie.year && (
              <p 
                className="text-2xl font-light tracking-[0.3em] text-white/40 uppercase"
                style={{
                  letterSpacing: "0.4em",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {movie.year}
              </p>
            )}
            
            {/* Title - Warm gold with soft glow */}
            <h2 
              className="text-7xl font-bold leading-none tracking-tight"
              style={{
                fontFamily: "'Cinzel', 'Trajan Pro', serif",
                color: "#D4AF37",
                textShadow: "0 0 40px rgba(212, 175, 55, 0.5), 0 0 80px rgba(212, 175, 55, 0.3), 0 4px 20px rgba(0,0,0,0.8)",
                letterSpacing: "0.02em",
                fontWeight: "700",
              }}
            >
              {movie.title}
            </h2>

            {/* Note (if provided) - Elegant and minimal */}
            {note && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <p 
                  className="text-2xl font-light leading-relaxed text-white/70 max-w-2xl mx-auto"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "0.05em",
                    lineHeight: "1.8",
                  }}
                >
                  {note}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional depth layers */}
      {/* Cool blue ambient light (top) */}
      <div 
        className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none z-5"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
        }}
      />
      
      {/* Warm highlight (bottom) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[400px] pointer-events-none z-5"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(251, 191, 36, 0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
});

ShareableImagePreview.displayName = "ShareableImagePreview";
