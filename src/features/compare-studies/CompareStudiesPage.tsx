import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  OutcomeIndicator,
  TrainingProgram,
} from "../../../data/schemas/generated";
import {
  getCompatibleComparison,
  type CompatibleComparison,
} from "../../domain/outcomes";
import { EmploymentIndicators } from "./EmploymentIndicators";
import { IncomeIndicators } from "./IncomeIndicators";
import {
  StudyComparisonForm,
  type StudySelection,
} from "./StudyComparisonForm";

export interface CompareStudiesData {
  programs: TrainingProgram[];
  indicators: OutcomeIndicator[];
}

export function CompareStudiesPage({ data }: { data: CompareStudiesData }) {
  const initialProgram = data.programs[0]?.programKey ?? "";
  const initialCohort =
    data.indicators.find(
      (indicator) => indicator.trainingProgramKey === initialProgram,
    )?.cohort ?? "";
  const [selection, setSelection] = useState<StudySelection>({
    programKeys: initialProgram ? [initialProgram] : [],
    cohort: initialCohort,
    postGraduationYear: 1,
  });
  const comparison = useMemo<CompatibleComparison>(() => {
    if (!selection.cohort || selection.programKeys.length === 0) {
      return { national: [], regional: [] };
    }
    try {
      return getCompatibleComparison(data.indicators, {
        programKeys: selection.programKeys,
        cohortByProgram: Object.fromEntries(
          selection.programKeys.map((programKey) => [
            programKey,
            selection.cohort,
          ]),
        ),
        postGraduationYear: selection.postGraduationYear,
      });
    } catch {
      return { national: [], regional: [] };
    }
  }, [data.indicators, selection]);
  const selectedProgram = data.programs.find(
    (program) => program.programKey === selection.programKeys[0],
  );

  return (
    <div className="journey-page comparison-page">
      <Link to="/">Volver al inicio</Link>
      <p className="eyebrow">Empleo e ingresos</p>
      <h1>Comparar estudios</h1>
      <p>
        Compara indicadores observados de ciclos y grupos oficiales con la
        cohorte y el año que elijas.
      </p>
      <StudyComparisonForm
        programs={data.programs}
        indicators={data.indicators}
        selection={selection}
        onChange={setSelection}
      />
      {data.indicators.length === 0 ? (
        <p role="status">
          Aún no hay indicadores de resultados descargados para esta versión del
          snapshot oficial.
        </p>
      ) : null}
      <EmploymentIndicators comparison={comparison} />
      <IncomeIndicators
        comparison={comparison}
        trainingLevel={selectedProgram?.level ?? "higher"}
      />
    </div>
  );
}
