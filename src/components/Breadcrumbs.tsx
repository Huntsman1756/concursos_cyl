import type { JSX } from "react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
}

function withoutConsecutiveDuplicates(
  items: readonly BreadcrumbItem[],
): BreadcrumbItem[] {
  return items.reduce<BreadcrumbItem[]>((result, item) => {
    if (result.at(-1)?.label !== item.label) result.push(item);
    return result;
  }, []);
}

export function Breadcrumbs({ items }: BreadcrumbsProps): JSX.Element {
  const visibleItems = withoutConsecutiveDuplicates(items);

  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      <ol>
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.to !== undefined && !isCurrent ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
