import type { PublishedRequirement } from "../../data/schemas/generated";
import type { SessionAnswer } from "../domain/evidence";

export function RequirementRow({
  requirement,
  answer,
  onAnswer,
}: {
  requirement: PublishedRequirement;
  answer?: SessionAnswer;
  onAnswer: (answer: SessionAnswer) => void;
}) {
  return (
    <div className="requirement-row">
      <p>
        <strong>{requirement.category}</strong>: {requirement.sourceQuote}
      </p>
      <div
        role="group"
        aria-label={`Tu comprobación: ${requirement.sourceQuote}`}
      >
        {(["has", "lacks", "unsure"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={answer === value}
            onClick={() => onAnswer(value)}
          >
            {value === "has"
              ? "Lo tengo"
              : value === "lacks"
                ? "No lo tengo"
                : "No estoy seguro"}
          </button>
        ))}
      </div>
    </div>
  );
}
