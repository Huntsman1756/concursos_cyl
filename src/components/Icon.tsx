import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  Clock3,
  Eye,
  FileCheck2,
  GraduationCap,
  Search,
  ShieldCheck,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "arrow-right"
  | "bar-chart"
  | "briefcase"
  | "calendar"
  | "clock"
  | "eye"
  | "file-check"
  | "graduation-cap"
  | "search"
  | "shield-check";

const icons: Record<IconName, LucideIcon> = {
  "arrow-right": ArrowRight,
  "bar-chart": BarChart3,
  briefcase: Briefcase,
  calendar: CalendarDays,
  clock: Clock3,
  eye: Eye,
  "file-check": FileCheck2,
  "graduation-cap": GraduationCap,
  search: Search,
  "shield-check": ShieldCheck,
};

interface IconProps extends Omit<LucideProps, "name"> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[name];

  return (
    <LucideIcon
      aria-hidden="true"
      focusable="false"
      size={24}
      strokeWidth={2}
      {...props}
    />
  );
}
