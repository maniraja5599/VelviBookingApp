"use client";

import React, { useState, useEffect } from "react";
import { VelviLogo } from "@/components/ui/VelviLogo";

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal";
  showTagline?: boolean;
  customLogoUrl?: string | null;
  businessName?: string;
  tagline?: string;
  className?: string;
}

/**
 * BrandLogo displays the customer's custom uploaded logo if present,
 * and automatically falls back to the default Velvi sacred logo if not provided or on image error.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "horizontal",
  showTagline = true,
  customLogoUrl,
  businessName,
  tagline,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error if URL changes
  useEffect(() => {
    setImgError(false);
  }, [customLogoUrl]);

  // If no custom logo or if custom logo failed to load, render default Velvi sacred logo
  if (!customLogoUrl || imgError) {
    return (
      <VelviLogo
        size={size}
        variant={variant}
        showTagline={showTagline}
        className={className}
      />
    );
  }

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: { title: "text-sm", tag: "text-[9px]" },
    md: { title: "text-base", tag: "text-[10px]" },
    lg: { title: "text-xl", tag: "text-xs" },
    xl: { title: "text-2xl", tag: "text-sm" },
  };

  const CustomImage = (
    <div
      className={`${iconSizes[size]} relative rounded-2xl overflow-hidden bg-white shadow-sacred shrink-0 border border-velvi-gold/40 flex items-center justify-center`}
    >
      <img
        src={customLogoUrl}
        alt={businessName || "Business Logo"}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{CustomImage}</div>;
  }

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        {CustomImage}
        <div>
          <h1
            className={`font-serif font-black tracking-wide text-velvi-brownDark ${textSizes[size].title}`}
          >
            {businessName || "Velvi"}
          </h1>
          {showTagline && (
            <p className={`font-medium text-velvi-brown/70 tracking-tight ${textSizes[size].tag}`}>
              {tagline || "Pooja • Homam • Seva Management"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {CustomImage}
      <div className="leading-tight">
        <h1
          className={`font-serif font-black tracking-wider text-velvi-brownDark uppercase ${textSizes[size].title}`}
        >
          {businessName || "Velvi"}
        </h1>
        {showTagline && (
          <p className={`font-semibold text-velvi-goldDark leading-none ${textSizes[size].tag}`}>
            {tagline || "Pooja • Homam • Seva"}
          </p>
        )}
      </div>
    </div>
  );
};
