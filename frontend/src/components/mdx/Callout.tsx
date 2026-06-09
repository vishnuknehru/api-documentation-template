import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutType = "note" | "warning" | "success" | "danger";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const styles: Record<CalloutType, { bg: string; border: string; icon: string; Icon: React.ElementType }> = {
  note: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    Icon: Info,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle,
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    Icon: XCircle,
  },
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const { bg, border, icon, Icon } = styles[type];

  return (
    <div className={cn("not-prose flex gap-3 rounded-lg border p-4 my-6", bg, border)}>
      <Icon size={18} className={cn("flex-shrink-0 mt-0.5", icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
        )}
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
