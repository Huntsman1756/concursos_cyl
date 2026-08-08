import type { PublishedRequirement } from "./requirements";

export function publishedRequirementLabel(
  requirement: PublishedRequirement,
): string {
  switch (requirement.category) {
    case "qualification_or_specialization":
      return `Titulación: ${requirement.normalizedValue}`;
    case "experience":
      return `Experiencia: ${requirement.normalizedValue} meses`;
    case "driving_license_or_vehicle":
      return requirement.normalizedValue === "B"
        ? "Permiso de conducir B"
        : "Movilidad o vehículo";
    case "certificate_or_regulated_license":
      return "Certificado o habilitación profesional";
    case "language":
      return `Idioma: ${requirement.normalizedValue.replace(":", " ")}`;
    case "schedule_availability":
      return "Disponibilidad horaria";
    case "mobility_or_work_mode":
      return "Movilidad o modalidad de trabajo";
    case "unclassified":
      return "Requisito pendiente de clasificación";
  }
}
