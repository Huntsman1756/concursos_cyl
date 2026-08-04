import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Eye,
  FileCheck2,
  GraduationCap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "arrow-right"
  | "briefcase"
  | "calendar"
  | "eye"
  | "file-check"
  | "graduation-cap";

const icons: Record<IconName, LucideIcon> = {
  "arrow-right": ArrowRight,
  briefcase: Briefcase,
  calendar: CalendarDays,
  eye: Eye,
  "file-check": FileCheck2,
  "graduation-cap": GraduationCap,
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
