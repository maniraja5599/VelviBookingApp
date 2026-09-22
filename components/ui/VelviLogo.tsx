"use client";

import React from "react";

interface VelviLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal";
  showTagline?: boolean;
  lightText?: boolean;
  className?: string;
}

export const VelviLogo: React.FC<VelviLogoProps> = ({
  size = "md",
  variant = "horizontal",
  showTagline = true,
  lightText = false,
  className = "",
}) => {
  const iconSizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    xs: { title: "text-xs", tag: "text-[8px]" },
    sm: { title: "text-sm", tag: "text-[9px]" },
    md: { title: "text-base", tag: "text-[10px]" },
    lg: { title: "text-xl", tag: "text-xs" },
    xl: { title: "text-2xl", tag: "text-sm" },
  };

  const IconElement = (
    <div
      className={`${iconSizes[size]} relative rounded-2xl overflow-hidden bg-white/95 shadow-sacred shrink-0 border border-velvi-gold/40 flex items-center justify-center p-0.5`}
    >
      <img
        src="/icons/velvi-logo.png"
        alt="Velvi"
        className="w-full h-full object-contain"
      />
    </div>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{IconElement}</div>;
  }

  if (variant === "full") {
    const fullSizes = {
      xs: "w-20 h-20",
      sm: "w-28 h-28",
      md: "w-40 h-40",
      lg: "w-52 h-52",
      xl: "w-64 h-64",
    };
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className={`${fullSizes[size]} relative overflow-hidden flex items-center justify-center drop-shadow-md`}>
          <img
            src="/icons/velvi-logo.png"
            alt="Velvi — நல்லதே நம் நோக்கம்"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {IconElement}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <h1
            className={`font-serif font-black tracking-wider uppercase ${
              lightText ? "text-white" : "text-velvi-brownDark"
            } ${textSizes[size].title}`}
          >
            VELVI
          </h1>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
              lightText
                ? "bg-velvi-gold/20 text-velvi-goldLight border-velvi-gold/40"
                : "bg-velvi-gold/15 text-velvi-brown border-velvi-gold/30"
            }`}
          >
            வேள்வி
          </span>
        </div>
        {showTagline && (
          <p
            className={`font-semibold leading-none mt-0.5 ${
              lightText ? "text-velvi-goldLight" : "text-velvi-goldDark"
            } ${textSizes[size].tag}`}
          >
            நல்லதே நம் நோக்கம்
          </p>
        )}
      </div>
    </div>
  );
};
