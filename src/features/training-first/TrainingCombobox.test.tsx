import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrainingProgram } from "../../../data/schemas/generated";
import { TrainingCombobox } from "./TrainingCombobox";

const programs: readonly TrainingProgram[] = [
  {
    programKey: "ADG01S",
    programTitle: "Administración y Finanzas",
    level: "higher",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC99M",
    programTitle: "Sistemas Microinformáticos y Redes",
    level: "intermediate",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "SAN01M",
    programTitle: "Cuidados Auxiliares de Enfermería",
    level: "intermediate",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "SAN01S",
    programTitle: "Cuidados Auxiliares de Enfermería",
    level: "higher",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
];

function renderCombobox(
  overrides: Partial<React.ComponentProps<typeof TrainingCombobox>> = {},
) {
  return render(
    <TrainingCombobox
      id="training-program"
      programs={programs}
      confirmedProgram={null}
      onConfirm={vi.fn()}
      onClear={vi.fn()}
      label="Ciclo oficial"
      hint="Busca un ciclo de Formación Profesional."
      {...overrides}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TrainingCombobox", () => {
  it("announces matching programs and confirms the first family search result by keyboard", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    renderCombobox({ onConfirm });

    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });
    expect(combobox).toHaveAttribute("aria-autocomplete", "list");
    await user.type(combobox, "informatica");
    expect(screen.getByText(/ciclos oficiales encontrados/i)).toHaveAttribute(
      "aria-live",
      "polite",
    );
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ programKey: "IFC03S" }),
    );
  });

  it("searches accent-insensitively by family, key, and level label", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "INFORMÁTICA");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      expect.stringContaining("IFC03S"),
      expect.stringContaining("IFC99M"),
    ]);
    await user.clear(combobox);
    await user.type(combobox, "san01m");
    expect(screen.getByRole("option")).toHaveTextContent(
      "Cuidados Auxiliares de Enfermería",
    );
    await user.clear(combobox);
    await user.type(combobox, "grado superior");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("disambiguates duplicate titles with level, family, and key in each option", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "cuidados auxiliares");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Cuidados Auxiliares de Enfermería");
    expect(options[0]).toHaveTextContent("Sanidad");
    expect(options[0]).toHaveTextContent("SAN01M");
    expect(options[1]).toHaveTextContent("Grado superior");
    expect(options[1]).toHaveTextContent("SAN01S");
  });

  it("wraps ArrowUp to the last result and exposes the active option", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "grado superior");
    const options = screen.getAllByRole("option");
    await user.keyboard("{ArrowUp}");

    expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      options.at(-1)?.id,
    );
    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
  });

  it("closes the list and removes listbox references on Escape", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "administracion");
    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(combobox).toHaveAttribute(
      "aria-controls",
      "training-program-listbox",
    );
    await user.keyboard("{Escape}");

    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(combobox).not.toHaveAttribute("aria-controls");
    expect(combobox).not.toHaveAttribute("aria-activedescendant");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows a zero-results message without exposing a listbox", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "ciclo inexistente");

    expect(
      screen.getByText("No encontramos un ciclo oficial con ese nombre."),
    ).toBeVisible();
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(combobox).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("confirms an option by click and clears stale confirmation when edited", async () => {
    const onConfirm = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    renderCombobox({ onConfirm, onClear });
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "administracion");
    await user.click(screen.getByRole("option"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ programKey: "ADG01S" }),
    );
    expect(combobox).toHaveValue("Administración y Finanzas");

    await user.type(combobox, " editado");
    expect(onClear).toHaveBeenCalled();
  });

  it("keeps closed ARIA state accurate before searching", () => {
    renderCombobox();

    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });
    expect(combobox).toHaveAttribute("aria-expanded", "false");
    expect(combobox).not.toHaveAttribute("aria-controls");
    expect(combobox).not.toHaveAttribute("aria-activedescendant");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps every option inside the component listbox", async () => {
    const user = userEvent.setup();
    renderCombobox();
    const combobox = screen.getByRole("combobox", { name: "Ciclo oficial" });

    await user.type(combobox, "grado");
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getAllByRole("option")).toHaveLength(
      programs.length,
    );
  });
});
