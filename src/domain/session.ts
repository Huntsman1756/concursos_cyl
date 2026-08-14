import { useCallback, useState } from "react";
import type { SessionAnswer, SessionAnswers } from "./evidence";

export interface SessionChecklistItem {
  id: string;
  label: string;
}

export interface DecisionSession {
  answers: SessionAnswers;
  checklist: SessionChecklistItem[];
  answerRequirement: (requirementId: string, answer: SessionAnswer) => void;
  addChecklistItem: (item: SessionChecklistItem) => void;
  removeChecklistItem: (itemId: string) => void;
  clearSession: () => void;
}

export function useDecisionSession(): DecisionSession {
  const [answers, setAnswers] = useState<SessionAnswers>({});
  const [checklist, setChecklist] = useState<SessionChecklistItem[]>([]);

  const answerRequirement = useCallback(
    (requirementId: string, answer: SessionAnswer) => {
      setAnswers((current) => ({ ...current, [requirementId]: answer }));
    },
    [],
  );
  const addChecklistItem = useCallback((item: SessionChecklistItem) => {
    setChecklist((current) =>
      current.some((existing) => existing.id === item.id)
        ? current
        : [...current, item],
    );
  }, []);
  const removeChecklistItem = useCallback((itemId: string) => {
    setChecklist((current) => current.filter((item) => item.id !== itemId));
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
