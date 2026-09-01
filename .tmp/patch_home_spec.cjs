const fs = require("node:fs");
const p = "tests/e2e/home.spec.ts";
let c = fs.readFileSync(p, "utf8");
const before = c;
c = c.split('name: "Desde FP"').join('name: "Explorar FP"');
c = c.split('name: "Comparar estudios"').join('name: "Comparar ingresos"');
c = c.split(
  'page.getByText("Relaciones revisadas", { exact: true })',
).join("page.getByText(/Relaciones revisadas/u)");
c = c.split("await expect(mobileAnchors).toHaveCount(6);").join("await expect(mobileAnchors).toHaveCount(10);");
fs.writeFileSync(p, c);
console.log("changed:", before !== c);
