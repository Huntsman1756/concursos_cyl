import { useCallback, useState } from "react";

import {
  ReliableActionSchema,
  isEngineIssuedSessionCheck,
  type AddSessionCheckAction,
  type SessionChecklistItem,
} from "./actionEngine";
import {
  SessionAnswerValueSchema,
  SessionAnswersSchema,
  type SessionAnswerValue,
  type SessionAnswers,
} from "./evidence";
import {
  PublishedRequirementSchema,
  type PublishedRequirement,
} from "./requirements";

export interface DecisionSession {
  answers: SessionAnswers;
  checklist: SessionChecklistItem[];
  answerRequirement: (
    requirement: PublishedRequirement,
    answer: SessionAnswerValue,
  ) => void;
  addChecklistItem: (action: AddSessionCheckAction) => void;
  removeChecklistItem: (id: string) => void;
  clearSession: () => void;
}

/** Keeps decision answers and source-backed checks in this React mount only. */
export function useDecisionSession(): DecisionSession {
  const [answers, setAnswers] = useState<SessionAnswers>({});
  const [checklist, setChecklist] = useState<SessionChecklistItem[]>([]);

  const answerRequirement = useCallback(
    (
      requirementInput: PublishedRequirement,
      answerInput: SessionAnswerValue,
    ) => {
      const requirement = PublishedRequirementSchema.parse(requirementInput);
      const answer = SessionAnswerValueSchema.parse(answerInput);
      setAnswers((current) =>
        SessionAnswersSchema.parse({ ...current, [requirement.id]: answer }),
      );
    },
    [],
  );

  const addChecklistItem = useCallback((actionInput: AddSessionCheckAction) => {
    if (!isEngineIssuedSessionCheck(actionInput)) {
      throw new Error(
        "Checklist action must be the actual engine-issued object.",
      );
    }
    const issuedAction = ReliableActionSchema.parse(actionInput);
    if (issuedAction.actionType !== "add_session_check") {
      throw new Error("Issued action is not a session checklist action.");
    }
    const action = issuedAction;
    setChecklist((current) => {
      const existing = current.find(
        (item) => item.id === action.checklistItem.id,
      );
      if (!existing) return [...current, action.checklistItem];
      if (JSON.stringify(existing) !== JSON.stringify(action.checklistItem)) {
        throw new Error("Conflicting checklist payload for a stable identity.");
      }
      return current;
    });
  }, []);

  const removeChecklistItem = useCallback((id: string) => {
    setChecklist((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearSession = useCallback(() => {
    setAnswers({});
    setChecklist([]);
  }, []);

  return {
    answers,
    checklist,
    answerRequirement,
    addChecklistItem,
    removeChecklistItem,
    clearSession,
  };
}
