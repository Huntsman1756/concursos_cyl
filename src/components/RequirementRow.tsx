import type { SessionAnswerValue } from "../domain/evidence";
import { publishedRequirementLabel } from "../domain/requirementPresentation";
import type { PublishedRequirement } from "../domain/requirements";

interface RequirementRowProps {
  requirement: PublishedRequirement;
  answer?: SessionAnswerValue;
  onAnswer: (
    requirement: PublishedRequirement,
    answer: SessionAnswerValue,
  ) => void;
}

export function RequirementRow({
  requirement,
  answer,
  onAnswer,
}: RequirementRowProps) {
  const label = publishedRequirementLabel(requirement);
  const choices: readonly [SessionAnswerValue, string][] = [
    ["has", "Lo tengo"],
    ["lacks", "No lo tengo"],
    ["unsure", "No estoy seguro"],
  ];
  return (
    <li className="requirement-row">
      <p className="requirement-row__label">{label}</p>
      <fieldset>
        <legend className="sr-only">
          Tu situación para: {requirement.sourceQuote}
        </legend>
        <div className="answer-options">
          {choices.map(([value, choiceLabel]) => (
            <label key={value}>
              <input
                type="radio"
                name={`answer-${requirement.id}`}
                value={value}
                checked={answer === value}
                onChange={() => onAnswer(requirement, value)}
                aria-label={`${choiceLabel}: ${requirement.sourceQuote}`}
              />
              <span>{choiceLabel}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </li>
  );
}
