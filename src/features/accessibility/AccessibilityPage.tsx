import { Link } from "react-router-dom";

import "./accessibility.css";

const ISSUES_URL =
  "https://github.com/Huntsman1756/concursos_cyl/issues/new?labels=accessibility";

export function AccessibilityPage() {
  return (
    <article className="accessibility-page">
      <header className="support-page-intro">
        <p className="support-page-intro__eyebrow">Compromiso verificable</p>
        <h1>Accesibilidad</h1>
        <p>
          Queremos que cualquier persona pueda consultar SALIDA CyL con teclado,
          lector de pantalla o ampliación, en móvil y en escritorio. Nuestro
          objetivo técnico es WCAG 2.1 nivel AA.
        </p>
      </header>

      <section className="accessibility-status" aria-labelledby="status-title">
        <div>
          <p>Estado actual</p>
          <h2 id="status-title">Evaluación continua, no certificación</h2>
        </div>
        <p>
          Las rutas principales se comprueban automáticamente en cada entrega
          con Axe y recorridos de teclado. Estas comprobaciones no equivalen a
          una auditoría formal completa ni permiten declarar conformidad total.
        </p>
      </section>

      <section
        className="accessibility-measures"
        aria-labelledby="measures-title"
      >
        <h2 id="measures-title">Qué comprobamos</h2>
        <dl>
          <div>
            <dt>Navegación</dt>
            <dd>Orden lógico, enlace de salto y foco visible.</dd>
          </div>
          <div>
            <dt>Formularios</dt>
            <dd>Etiquetas, instrucciones y errores asociados al control.</dd>
          </div>
          <div>
            <dt>Contenido</dt>
            <dd>Jerarquía semántica, texto alternativo y lenguaje directo.</dd>
          </div>
          <div>
            <dt>Presentación</dt>
            <dd>Diseño adaptable, contraste y movimiento reducido.</dd>
          </div>
        </dl>
      </section>

      <section
        className="accessibility-limitations"
        aria-labelledby="limits-title"
      >
        <h2 id="limits-title">Limitaciones conocidas</h2>
        <p>
          La validación automática no detecta todas las barreras. Las fuentes
          oficiales enlazadas, especialmente documentos PDF de terceros, pueden
          tener condiciones de accesibilidad distintas a las de esta web.
        </p>
        <p>
          SALIDA CyL es un proyecto independiente y no se presenta como una
          administración pública. Adoptamos como referencia las buenas prácticas
          reconocibles por el sector público sin atribuirnos una certificación
          ni una obligación institucional que no nos corresponde.
        </p>
      </section>

      <section
        className="accessibility-contact"
        aria-labelledby="contact-title"
      >
        <div>
          <h2 id="contact-title">Comunicar una barrera</h2>
          <p>
            Describe la página, el problema y, si puedes, el navegador o ayuda
            técnica utilizada. La incidencia quedará pública y trazable.
          </p>
        </div>
        <a className="primary-button" href={ISSUES_URL}>
          Abrir una incidencia de accesibilidad
        </a>
      </section>

      <p className="accessibility-page__related">
        <Link to="/metodologia">Consultar metodología y fuentes</Link>
        {" · "}
        <a href="https://github.com/Huntsman1756/concursos_cyl">
          Revisar las pruebas y el código
        </a>
      </p>
    </article>
  );
}
