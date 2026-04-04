import { useState } from 'react';
import { NotifyMePopup } from './NotifyMePopup';

export function ComingSoonOverlay({ turfId, turfName }: { turfId: string; turfName: string }) {
  const [showNotify, setShowNotify] = useState(false);

  return (
    <>
      <div className="absolute inset-0 z-10 
                      rounded-2xl overflow-hidden
                      flex flex-col items-center 
                      justify-center gap-3
                      backdrop-blur-[2px]">
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 
                        bg-gradient-to-b 
                        from-black/40 via-black/60 to-black/80" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col 
                        items-center gap-2 px-4">
          
          {/* Badge */}
          <div className="flex items-center gap-2 
                          bg-orange-500 text-white 
                          px-4 py-1.5 rounded-full
                          text-xs font-bold tracking-widest
                          uppercase shadow-lg">
            <span className="w-1.5 h-1.5 bg-white 
                             rounded-full animate-pulse" />
            Coming Soon
          </div>
          
          {/* Main text */}
          <p className="text-white font-bold text-lg 
                        text-center leading-tight">
            Opening Soon
          </p>
          
          {/* Subtext */}
          <p className="text-white/70 text-xs text-center">
            We're getting this turf ready for you
          </p>

          {/* Notify button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setShowNotify(true)
            }}
            className="mt-1 bg-white/20 hover:bg-white/30 
                       backdrop-blur-sm border border-white/30
                       text-white text-xs font-medium 
                       px-4 py-2 rounded-full 
                       transition-all duration-200
                       hover:scale-105"
          >
            🔔 Notify Me
          </button>
        </div>
      </div>
      
      {showNotify && (
        <NotifyMePopup 
          turfId={turfId} 
          turfName={turfName} 
          onClose={() => setShowNotify(false)} 
        />
      )}
    </>
  )
}
