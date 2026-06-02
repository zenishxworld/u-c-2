import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: "default" | "primary" | "accent";
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default",
  onClick
}: StatCardProps) {
  const variantStyles = {
    default: "border-gray-200/80 hover:border-gray-300",
    primary: "border-[#E08D3C]/30 hover:border-[#E08D3C]/60",
    accent: "border-[#C4DFF0]/60 hover:border-[#C4DFF0]/90"
  };

  const gradientStyles = {
    default: "linear-gradient(160deg, #e0f0fa 0%, #ffffff 45%, #fae6d1 100%)",
    primary: "linear-gradient(160deg, #fff7f0 0%, #ffffff 60%, #fae6d1 100%)",
    accent: "linear-gradient(160deg, #e0f0fa 0%, #ffffff 60%, #f0f7fd 100%)"
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-6 rounded-2xl border-2 shadow-md",
        "transition-all duration-500 ease-out",
        "hover:shadow-[0_20px_50px_-12px_rgba(224,141,60,0.2)]",
        "group overflow-hidden bg-white/70 backdrop-blur-sm",
        onClick && "cursor-pointer",
        variantStyles[variant],
        className
      )}
      style={{ background: gradientStyles[variant] }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large soft circle — top right */}
        <div className={cn(
          "absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.07]",
          variant === "primary" ? "bg-[#E08D3C]" : variant === "accent" ? "bg-[#C4DFF0]" : "bg-[#2C3539]"
        )} />
        {/* Smaller ring — bottom left */}
        <div className={cn(
          "absolute -bottom-5 -left-5 w-20 h-20 rounded-full border-[3px] opacity-[0.08]",
          variant === "primary" ? "border-[#E08D3C]" : variant === "accent" ? "border-[#C4DFF0]" : "border-[#2C3539]"
        )} />
        {/* Dot cluster — top left */}
        <div className="absolute top-4 left-4 opacity-[0.06]">
          <div className="grid grid-cols-3 gap-1.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={cn(
                "w-1 h-1 rounded-full",
                variant === "primary" ? "bg-[#E08D3C]" : variant === "accent" ? "bg-[#C4DFF0]" : "bg-[#2C3539]"
              )} />
            ))}
          </div>
        </div>
        {/* Diagonal accent line */}
        <div className={cn(
          "absolute top-0 right-16 w-[1px] h-16 rotate-[30deg] origin-top opacity-[0.1]",
          variant === "primary" ? "bg-[#E08D3C]" : variant === "accent" ? "bg-[#C4DFF0]" : "bg-[#2C3539]"
        )} />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn(
              "p-3.5 rounded-2xl shadow-lg ring-1 ring-white/20",
              variant === "primary" 
                ? "bg-gradient-to-br from-[#E08D3C] to-[#d07a2a] shadow-[#E08D3C]/25" 
                : variant === "accent" 
                ? "bg-gradient-to-br from-[#C4DFF0] to-[#a8cfe6] shadow-[#C4DFF0]/30" 
                : "bg-gradient-to-br from-[#2C3539] to-[#3d4a50] shadow-[#2C3539]/20"
            )}>
              <Icon className="w-7 h-7 text-white drop-shadow-sm" strokeWidth={1.8} />
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
        )}

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-pill",
              trend.value > 0 
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : trend.value < 0
                ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}