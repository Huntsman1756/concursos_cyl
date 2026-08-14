import type { ReliableAction } from "../domain/actionEngine";

export function ActionPanel({
  actions,
  onAddSessionCheck,
}: {
  actions: ReliableAction[];
  onAddSessionCheck?: (requirementId: string | null, label: string) => void;
}) {
  return (
    <div className="action-panel">
      {actions.map((action) =>
        "href" in action ? (
          <a key={`${action.actionType}-${action.href}`} href={action.href}>
            {action.label}
          </a>
        ) : (
          <button
            key={action.actionType}
            type="button"
            onClick={
              action.actionType === "add_session_check"
                ? () => onAddSessionCheck?.(action.requirementId, action.label)
                : undefined
            }
          >
            {action.label}
          </button>
        ),
      )}
    </div>
  );
}
