import { EntryCard } from "../../components/EntryCard";
import { Icon, type IconName } from "../../components/Icon";

const proofPoints: Array<{ label: string; iconName: IconName }> = [
  { label: "Fuentes visibles", iconName: "eye" },
  { label: "Sin nota opaca", iconName: "file-check" },
  { label: "Datos con fecha", iconName: "calendar" },
];

export function HomePage() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-heading">
        <p className="home-hero__eyebrow">Decide con información clara</p>
        <h1 id="home-heading">Dos caminos para encontrar tu siguiente paso</h1>
        <p className="home-hero__intro">
          Empieza por lo que ya has estudiado o por el trabajo al que quieres
          llegar.
        </p>
      </section>

      <section className="entry-grid" aria-label="Elige tu punto de partida">
        <EntryCard
          title="He terminado FP"
          outcome="Título → ofertas → requisitos → acciones"
          to="/desde-fp"
          cta="Explorar: He terminado FP"
          iconName="graduation-cap"
        />
        <EntryCard
          title="Quiero trabajar de…"
          outcome="Ocupación → ciclos y centros de CyL"
          to="/desde-ocupacion"
          cta="Explorar: Quiero trabajar de…"
          iconName="briefcase"
        />
      </section>

      <ul className="proof-points" aria-label="Compromisos de transparencia">
        {proofPoints.map(({ label, iconName }) => (
          <li key={label}>
            <Icon name={iconName} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
