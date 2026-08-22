import type { JSX } from "react";
import { Icon } from "./Icon";
import "../styles/print.css";

export interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({
  label = "Imprimir esta orientación",
  className,
}: PrintButtonProps): JSX.Element {
  const classes = ["print-control", className]
    .filter((value): value is string => value !== undefined && value.length > 0)
    .join(" ");

  return (
    <button className={classes} type="button" onClick={() => window.print()}>
      <Icon name="printer" />
      {label}
    </button>
  );
}
