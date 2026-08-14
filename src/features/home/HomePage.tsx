import { EntryCard } from "../../components/EntryCard";

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-page__intro" aria-labelledby="home-title">
        <p className="eyebrow">Tu siguiente paso, con fuentes oficiales</p>
        <h1 id="home-title">Convierte lo que sabes en una salida posible.</h1>
        <p>
          Explora ofertas, requisitos y rutas formativas de Castilla y León sin
          notas opacas ni recomendaciones imposibles de comprobar.
        </p>
      </section>

      <section aria-labelledby="entry-title">
        <h2 id="entry-title" className="visually-hidden">
          Elige cómo empezar
        </h2>
        <div className="entry-grid">
          <EntryCard
            icon="graduation-cap"
            title="He terminado FP"
            outcome="Título → ofertas → requisitos → acciones"
            to="/desde-fp"
          />
          <EntryCard
            icon="briefcase"
            title="Quiero trabajar de…"
            outcome="Ocupación → ciclos y centros de CyL"
            to="/desde-ocupacion"
          />
        </div>
      </section>

      <ul className="proof-list" aria-label="Principios de SALIDA CyL">
        <li>Fuentes visibles</li>
        <li>Sin nota opaca</li>
        <li>Datos con fecha</li>
      </ul>
    </div>
  );
}
