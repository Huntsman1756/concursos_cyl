import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarDays,
  Clock3,
  Database,
  Eye,
  FileCheck2,
  GraduationCap,
  Menu,
  Printer,
  Search,
  ShieldCheck,
  UserRoundX,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "arrow-right"
  | "badge-check"
  | "bar-chart"
  | "briefcase"
  | "calendar"
  | "clock"
  | "database"
  | "eye"
  | "file-check"
  | "graduation-cap"
  | "menu"
  | "printer"
  | "search"
  | "shield-check"
  | "user-round-x"
  | "x";

const icons: Record<IconName, LucideIcon> = {
  "arrow-right": ArrowRight,
  "badge-check": BadgeCheck,
  "bar-chart": BarChart3,
  briefcase: Briefcase,
  calendar: CalendarDays,
  clock: Clock3,
  database: Database,
  eye: Eye,
  "file-check": FileCheck2,
  "graduation-cap": GraduationCap,
  menu: Menu,
  printer: Printer,
  search: Search,
  "shield-check": ShieldCheck,
  "user-round-x": UserRoundX,
  x: X,
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
