import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type IconName = "arrow-right" | "briefcase" | "graduation-cap";

const icons: Record<IconName, LucideIcon> = {
  "arrow-right": ArrowRight,
  briefcase: BriefcaseBusiness,
  "graduation-cap": GraduationCap,
};

export function Icon({ name }: { name: IconName }) {
  const IconComponent = icons[name];
  return <IconComponent aria-hidden="true" focusable="false" size={24} />;
}
