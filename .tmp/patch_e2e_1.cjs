const fs = require("node:fs");

function patch(file, pairs) {
  let c = fs.readFileSync(file, "utf8");
  const before = c;
  for (const [from, to] of pairs) c = c.split(from).join(to);
  fs.writeFileSync(file, c);
  console.log(file, "changed:", before !== c);
}

patch("tests/e2e/home.spec.ts", [
  ['name: "Ver las salidas de este título"', 'name: "Ver en qué puedes trabajar"'],
]);

patch("tests/e2e/contest-readiness.spec.ts", [
  ['name: "Ver las salidas de este título"', 'name: "Ver en qué puedes trabajar"'],
]);

patch("tests/e2e/occupation-first.spec.ts", [
  [
    'await expect(page.getByText("Salida profesional oficial")).toHaveCount(2);',
    'await expect(\n    page.getByText(\n      "El perfil oficial del ciclo incluye esta salida profesional.",\n    ),\n  ).toHaveCount(2);',
  ],
  [
    'await page.getByText("Relación revisada").count(),',
    'await page\n      .getByText(\n        "Relación comprobada por competencias compartidas antes de publicarse.",\n      )\n      .count(),',
  ],
]);
