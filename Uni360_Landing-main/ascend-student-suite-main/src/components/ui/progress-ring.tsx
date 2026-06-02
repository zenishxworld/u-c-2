import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({ 
  progress, 
  size = "md", 
  className,
  children 
}: ProgressRingProps) {
  const sizeConfig = {
    sm: { ring: 60, stroke: 4, text: "text-sm" },
    md: { ring: 80, stroke: 6, text: "text-base" },
    lg: { ring: 120, stroke: 8, text: "text-lg" }
  };

  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={config.ring}
        height={config.ring}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={config.stroke}
          fill="transparent"
        />
        {/* Progress ring */}
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={config.stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-entrance ease-out"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        config.text,
        "font-semibold text-foreground"
      )}>
        {children || `${Math.round(progress)}%`}
      </div>
    </div>
  );
}