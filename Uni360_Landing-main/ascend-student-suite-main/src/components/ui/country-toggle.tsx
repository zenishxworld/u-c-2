import { useState } from "react";
import { cn } from "@/lib/utils";
import GermanyFlag from "/assets/germany-logo.png";
import UKFlag from "/assets/uk-logo.png";

type Country = "DE" | "UK";

interface CountryToggleProps {
  value: Country;
  onChange: (country: Country) => void;
  className?: string;
  disabled?: boolean;
}

export function CountryToggle({
  value,
  onChange,
  className,
  disabled = false,
}: CountryToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-pill",
        "border border-blue-200/50 shadow-sm",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{ background: "linear-gradient(160deg, rgba(224,240,250,0.95) 0%, rgba(240,247,253,0.95) 100%)" }}
      title={
        disabled
          ? "Country selection locked based on your profile preference"
          : "Switch between Germany and UK"
      }>
      <button
        onClick={() => !disabled && onChange("DE")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-pill transition-all duration-micro ease-out text-sm font-medium",
          // Desktop styling
          "px-4 py-2",
          // Mobile styling - smaller padding and no gap for text
          "sm:px-4 sm:py-2 px-2 py-1.5 sm:gap-2 gap-0",
          value === "DE"
            ? "bg-gradient-to-r from-[#E08D3C] to-[#d07a2a] text-white shadow-md"
            : "text-[#2C3539] hover:text-[#E08D3C]",
          disabled && "cursor-not-allowed",
          disabled && value !== "DE" && "opacity-30"
        )}
        title={disabled ? "Locked" : "Germany"}>
        <img
          src={GermanyFlag}
          alt="Germany Flag"
          className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
        />
        <span className="hidden sm:inline">Germany</span>
      </button>
      <button
        onClick={() => !disabled && onChange("UK")}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-pill transition-all duration-micro ease-out text-sm font-medium",
          // Desktop styling
          "px-4 py-2",
          // Mobile styling - smaller padding and no gap for text
          "sm:px-4 sm:py-2 px-2 py-1.5 sm:gap-2 gap-0",
          value === "UK"
            ? "bg-gradient-to-r from-[#E08D3C] to-[#d07a2a] text-white shadow-md"
            : "text-[#2C3539] hover:text-[#E08D3C]",
          disabled && "cursor-not-allowed",
          disabled && value !== "UK" && "opacity-30"
        )}
        title={disabled ? "Locked" : "United Kingdom"}>
        <img
          src={UKFlag}
          alt="UK Flag"
          className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
        />
        <span className="hidden sm:inline">United Kingdom</span>
      </button>
    </div>
  );
}
