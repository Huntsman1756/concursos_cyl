import type { ReliableAction } from "../domain/actionEngine";

export function ActionPanel({ actions }: { actions: ReliableAction[] }) {
  return (
    <div className="action-panel">
      {actions.map((action) =>
        "href" in action ? (
          <a key={`${action.actionType}-${action.href}`} href={action.href}>
            {action.label}
          </a>
        ) : (
          <button key={action.actionType} type="button">
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
