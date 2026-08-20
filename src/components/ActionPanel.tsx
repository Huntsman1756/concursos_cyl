import { Link } from "react-router-dom";
import type { TrainingProgram } from "../../data/schemas/generated";
import type {
  AddSessionCheckAction,
  ReliableAction,
  SessionChecklistItem,
} from "../domain/actionEngine";
import { trainingLevelLabel } from "../domain/trainingPresentation";

type ExploreUnpublishedRequirementAction = Extract<
  ReliableAction,
  { actionType: "explore_unpublished_requirement" }
>;

interface ActionPanelProps {
  programs: readonly TrainingProgram[];
  actions: readonly ReliableAction[];
  checklist: readonly SessionChecklistItem[];
  onAddChecklist: (action: AddSessionCheckAction) => void;
  onRemoveChecklist: (id: string) => void;
  onExploreUnpublishedRequirement: (
    action: ExploreUnpublishedRequirementAction,
  ) => void;
}

export function ActionPanel({
  programs,
  actions,
  checklist,
  onAddChecklist,
  onRemoveChecklist,
  onExploreUnpublishedRequirement,
}: ActionPanelProps) {
  const visibleActions = actions.filter(
    (action) =>
      action.actionType !== "open_original_offer" ||
      !actions.some(
        (candidate) =>
          candidate.actionType === "verify_offer_requirements" &&
          candidate.href === action.href,
      ),
  );

  return (
    <div className="action-panel">
      <ul className="action-list">
        {visibleActions.map((action) => {
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
                <p className="action-group-label">{action.label}</p>
                <ul className="action-sublist">
                  {action.programKeys.map((routeProgramKey) => {
                    const program = programs.find(
                      ({ programKey }) => programKey === routeProgramKey,
                    );
                    if (program === undefined) {
                      throw new Error(
                        `Missing official training program metadata for ${routeProgramKey}.`,
                      );
                    }
                    return (
                      <li key={routeProgramKey}>
                        <Link
                          className="action-link"
                          to={`/formacion/${encodeURIComponent(routeProgramKey)}`}
                        >
                          {program.programTitle},{" "}
                          {trainingLevelLabel(program.level)},{" "}
                          {program.programKey}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
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
            return (
              <li key={key}>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onExploreUnpublishedRequirement(action)}
                >
                  {action.label}
                </button>
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
