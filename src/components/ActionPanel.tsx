import { Link } from "react-router-dom";
import type {
  AddSessionCheckAction,
  ReliableAction,
  SessionChecklistItem,
} from "../domain/actionEngine";

interface ActionPanelProps {
  programKey: string;
  actions: readonly ReliableAction[];
  checklist: readonly SessionChecklistItem[];
  onAddChecklist: (action: AddSessionCheckAction) => void;
  onRemoveChecklist: (id: string) => void;
}

export function ActionPanel({
  programKey,
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
                  to={`/formacion/${action.programKeys[0]}`}
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
          if (action.actionType === "explore_unpublished_requirement") {
            const query = new URLSearchParams({
              publication: "not-published",
              category: action.filter.category,
              value: String(action.filter.normalizedValue),
            });
            return (
              <li key={key}>
                <Link
                  className="action-link"
                  to={`/desde-fp/${encodeURIComponent(programKey)}?${query.toString()}`}
                >
                  {action.label}
                </Link>
                <p className="action-note">
                  Compara solo la ausencia de ese dato publicado; no presupone
                  que el requisito no exista.
                </p>
              </li>
            );
          }
          return null;
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
