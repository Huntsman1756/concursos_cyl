import { Link } from "react-router-dom";

import { useRouteReady } from "../../app/RouteReadyContext";
import "./organizations.css";

export function OrganizationsPage() {
  useRouteReady(true);

  return (
    <article
      className="organizations-page"
      aria-labelledby="organizations-heading"
    >
      <header className="support-page-intro">
        <p className="support-page-intro__eyebrow">Reutilización profesional</p>
        <h1 id="organizations-heading">Para centros y administraciones</h1>
        <p>
          Una base común para orientar con evidencia, preparar sesiones y
          detectar dónde todavía faltan relaciones verificadas entre formación y
          empleo.
        </p>
      </header>

      <section
        className="organizations-audiences"
        aria-label="Usos profesionales"
      >
        <article>
          <p className="organizations-audience__label">Orientación</p>
          <h2>Conversaciones con un punto de partida claro</h2>
          <p>
            Recorrer ambos sentidos —del título al empleo y de la ocupación a la
            FP— sin mezclar salidas oficiales, ofertas actuales y contexto
            territorial.
          </p>
        </article>
        <article>
          <p className="organizations-audience__label">Centros de FP</p>
          <h2>Explicar para qué prepara cada ciclo</h2>
          <p>
            Compartir rutas revisadas, centros y modalidades mediante enlaces
            públicos, sin cuentas ni perfiles de alumnado.
          </p>
        </article>
        <article>
          <p className="organizations-audience__label">
            Administraciones locales
          </p>
          <h2>Leer formación, empleo y territorio juntos</h2>
          <p>
            Identificar cobertura formativa y vacíos de información antes de
            diseñar acciones de orientación o desarrollo local.
          </p>
        </article>
      </section>

      <section className="organizations-value" aria-labelledby="value-title">
        <div>
          <p>Valor público y económico</p>
          <h2 id="value-title">Menos tiempo buscando; más tiempo orientando</h2>
        </div>
        <div>
          <p>
            SALIDA CyL reúne fuentes que normalmente se consultan por separado y
            conserva su fecha, procedencia y límites. Esto reduce trabajo de
            contraste y permite reutilizar una explicación común.
          </p>
          <p>
            No publicamos estimaciones de ahorro, acuerdos ni resultados de
            adopción que todavía no se han medido.
          </p>
        </div>
      </section>

      <section className="organizations-reuse" aria-labelledby="reuse-title">
        <h2 id="reuse-title">Qué se puede reutilizar hoy</h2>
        <ul>
          <li>Grafo FP↔ocupación en CSV y JSON con licencia abierta.</li>
          <li>Código del pipeline y validaciones en el repositorio público.</li>
          <li>
            Enlaces estables a resultados, centros, fuentes y metodología.
          </li>
        </ul>
        <div className="organizations-reuse__actions">
          <Link className="primary-button" to="/datos-abiertos">
            Descargar datos abiertos
          </Link>
          <a
            className="secondary-button"
            href="https://github.com/Huntsman1756/concursos_cyl"
          >
            Consultar código y pipeline
          </a>
        </div>
      </section>

      <section
        className="organizations-boundary"
        aria-labelledby="boundary-title"
      >
        <h2 id="boundary-title">Alcance honesto</h2>
        <p>
          El producto ayuda a preparar decisiones, pero no sustituye la atención
          de un orientador ni acredita acceso a una ocupación. Una relación
          ausente significa que aún no está revisada, no que sea imposible.
        </p>
        <Link to="/metodologia">Ver fuentes, método y limitaciones</Link>
      </section>
    </article>
  );
}
