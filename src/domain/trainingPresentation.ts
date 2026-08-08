import type { TrainingProgram } from "../../data/schemas/generated";

const levelLabels: Record<TrainingProgram["level"], string> = {
  basic: "Grado básico",
  intermediate: "Grado medio",
  higher: "Grado superior",
  specialization: "Curso de especialización",
};

export function trainingLevelLabel(level: TrainingProgram["level"]): string {
  return levelLabels[level];
}
