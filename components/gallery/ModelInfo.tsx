/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

interface ModelInfoProps {
  data: any;
}

export function ModelInfo({ data }: ModelInfoProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!data) return null;

  const { appearance, performances, bios, social_media, nationality, date_of_birth, height, weight, hair_color, tattoos, aliases, gender } = data;

  return (
    <div className="w-full border-b border-muted/20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-md text-[13px] font-black text-foreground transition-all border border-muted/20 mb-4"
      >
        <span>Model Info</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4 py-6 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Column 1: Basic & Appearance */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-widest border-b border-pink-500/20 pb-1 mb-3">Identity & Physics</h4>
            <InfoItem label="Aliases" value={aliases} />
            <InfoItem label="Gender" value={gender} />
            <InfoItem label="Birthday" value={date_of_birth} />
            <InfoItem label="Nationality" value={nationality} />
            <InfoItem label="Height" value={appearance?.height || height} />
            <InfoItem label="Weight" value={appearance?.weight || weight} />
            <InfoItem label="Hair Color" value={appearance?.hair_color || hair_color} />
            <InfoItem label="Tattoos" value={appearance?.tattoos || tattoos} />
          </div>

          {/* Column 2: Specific Measurements */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-widest border-b border-pink-500/20 pb-1 mb-3">Measurements</h4>
            <InfoItem label="Ethnicity" value={appearance?.ethnicity} />
            <InfoItem label="Bust" value={appearance?.bust} />
            <InfoItem label="Cup" value={appearance?.cup} />
            <InfoItem label="Waist" value={appearance?.waist} />
            <InfoItem label="Hip" value={appearance?.hip} />
            <InfoItem label="Butt" value={appearance?.butt} />
            <InfoItem label="Body Type" value={appearance?.body_type} />
          </div>

          {/* Column 3: Performances & Bios */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-widest border-b border-pink-500/20 pb-1 mb-3">Performance</h4>
            <InfoItem label="Shown" value={performances?.shown} />
            <InfoItem label="Solo" value={performances?.solo} />
            <InfoItem label="Girl/Girl" value={performances?.girl_girl} />
            <InfoItem label="Boy/Girl" value={performances?.boy_girl} />
            
            <div className="mt-6">
              <h4 className="text-[11px] font-black text-pink-500 uppercase tracking-widest border-b border-pink-500/20 pb-1 mb-2">Short Bio</h4>
              <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4 italic">
                {bios?.eporner || "No bio available."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[12px] font-bold text-muted-foreground whitespace-nowrap">{label}:</span>
      <span className="text-[13px] text-foreground font-medium">{value}</span>
    </div>
  )
}
