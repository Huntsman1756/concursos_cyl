import { expect, test } from "@playwright/test";

const reviewedPrograms = [
  {
    programKey: "ADG01M",
    title: "Gestión Administrativa",
    occupationCodes: ["4113"],
  },
  {
    programKey: "ADG02S",
    title: "Administración y Finanzas",
    occupationCodes: ["4111", "4113", "4123", "4223"],
  },
  {
    programKey: "AFD01S",
    title: "Enseñanza y Animación Sociodeportiva",
    occupationCodes: ["3722", "3723", "3724", "5992"],
  },
  {
    programKey: "IFC02S",
    title: "Desarrollo de Aplicaciones Multiplataforma",
    occupationCodes: ["2713", "3820"],
  },
  {
    programKey: "IFC01S",
    title: "Administración de Sistemas Informáticos en Red",
    occupationCodes: ["2721", "2722", "3812", "3813", "3814"],
  },
  {
    programKey: "SSC01S",
    title: "Educación Infantil",
    occupationCodes: ["2252"],
  },
  {
    programKey: "SSC03S",
    title: "Integración Social",
    occupationCodes: ["2312", "3713"],
  },
  {
    programKey: "IMA03M",
    title: "Mantenimiento Electromecánico",
    occupationCodes: ["8202"],
  },
  {
    programKey: "TMV02M",
    title: "Electromecánica de Vehículos Automóviles",
    occupationCodes: ["7401"],
  },
  {
    programKey: "ELE04S",
    title: "Automatización y Robótica Industrial",
    occupationCodes: ["3123", "3124", "3129", "3139", "3209", "7521"],
  },
  {
    programKey: "FME01M",
    title: "Mecanizado",
    occupationCodes: ["7322", "7323", "7324"],
  },
  {
    programKey: "HOT04S",
    title: "Dirección de Cocina",
    occupationCodes: ["5110"],
  },
] as const;

for (const program of reviewedPrograms) {
  test(`${program.programKey} publishes reviewed routes without inventing offer matches`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${program.programKey}`);

    await expect(
      page.getByRole("heading", { name: program.title }),
    ).toBeVisible();
    for (const code of program.occupationCodes) {
      await expect(page.getByText(`CNO-11 ${code}`)).toBeVisible();
    }
    await expect(
      page.getByText(/No hay ofertas relacionadas en la copia de datos del/u),
    ).toBeVisible();
    await expect(
      page.getByText(/no hay (empleo|trabajo|puestos)/iu),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Ver centros y modalidades" }),
    ).toHaveAttribute("href", `/formacion/${program.programKey}`);
  });
}
