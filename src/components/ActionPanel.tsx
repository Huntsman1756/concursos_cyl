import { Link } from "react-router-dom";
import type {
  AddSessionCheckAction,
  ReliableAction,
  SessionChecklistItem,
} from "../domain/actionEngine";

interface ActionPanelProps {
  actions: readonly ReliableAction[];
  checklist: readonly SessionChecklistItem[];
  onAddChecklist: (action: AddSessionCheckAction) => void;
  onRemoveChecklist: (id: string) => void;
}

export function ActionPanel({
  actions,
  checklist,
  onAddChecklist,
  onRemoveChecklist,
}: ActionPanelProps) {
  return (
    <div className="action-panel">
      <ul className="action-list">
        {actions.map((action) => {
          const key = `${action.actionType}-${action.offerId}-${action.label}`;
          if (
            action.actionType === "open_original_offer" ||
            action.actionType === "verify_offer_requirements" ||
            action.actionType === "open_official_procedure"
          ) {
            return (
              <li key={key}>
                <a
                  className="action-link"
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {action.label}
                  {action.actionType === "open_official_procedure" &&
                    `: ${action.title}`}
                  <span className="sr-only"> (abre en una pestaña nueva)</span>
                </a>
              </li>
            );
          }
          if (action.actionType === "view_regulated_training_route") {
            return (
              <li key={key}>
                <Link
                  className="action-link"
                  to={`/desde-fp/${action.programKeys[0]}`}
                >
                  {action.label}
                </Link>
              </li>
            );
          }
          if (action.actionType === "add_session_check") {
            const added = checklist.some(
              ({ id }) => id === action.checklistItem.id,
            );
            return (
              <li key={key}>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    added
                      ? onRemoveChecklist(action.checklistItem.id)
                      : onAddChecklist(action)
                  }
                >
                  {added ? "Quitar de comprobaciones" : action.label}
                </button>
              </li>
            );
          }
          if (action.actionType === "adjust_search_area") {
            return (
              <li key={key}>
                <Link className="action-link" to="/desde-fp">
                  {action.label}
                </Link>
              </li>
            );
          }
          return (
            <li key={key}>
              <p>{action.label}</p>
              <p className="action-note">
                Esta comparación se limita a lo que la vacante publica.
              </p>
            </li>
          );
        })}
      </ul>
      {checklist.length > 0 && (
        <aside
          className="session-checklist"
          aria-label="Comprobaciones de esta sesión"
        >
          <p>Guardado solo mientras mantengas abierta esta página.</p>
          <ul>
            {checklist.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
