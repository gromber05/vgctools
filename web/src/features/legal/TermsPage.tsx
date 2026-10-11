import { href } from '@/app/router';
import { LEGAL } from './legalInfo';

export function TermsPage() {
  return (
    <article className="page legal">
      <h1>Términos de uso y aviso legal</h1>
      <p className="muted">Última actualización: {LEGAL.updated}</p>

      <h2>1. Titular</h2>
      <p>
        VGC Tools es un proyecto personal y gratuito cuyo titular es {LEGAL.owner} ({LEGAL.ownerId}). Contacto: <b>{LEGAL.email}</b>.
      </p>

      <h2>2. Aceptación</h2>
      <p>
        Al crear una cuenta confirmas que tienes al menos {LEGAL.minAge} años y aceptas estos términos y la{' '}
        <a href={href({ page: 'privacy' })}>política de privacidad</a>. Si no estás de acuerdo, no utilices el servicio.
      </p>

      <h2>3. El servicio</h2>
      <p>
        VGC Tools permite construir equipos de Pokémon, calcular daños y analizar repeticiones públicas de Pokémon Showdown. Es gratuito y
        se ofrece «tal cual»: puede cambiar, interrumpirse o dejar de prestarse en cualquier momento. Los cálculos y estadísticas son
        orientativos y pueden contener errores; no se garantiza su exactitud.
      </p>

      <h2>4. Tu cuenta</h2>
      <ul>
        <li>Eres responsable de mantener tu contraseña en secreto y de la actividad realizada con tu cuenta.</li>
        <li>No uses un nombre de usuario que suplante a otra persona o que sea ofensivo.</li>
        <li>Puedes borrar tu cuenta y todos tus datos cuando quieras desde la sección Usuario.</li>
      </ul>

      <h2>5. Uso aceptable</h2>
      <p>No está permitido:</p>
      <ul>
        <li>Intentar acceder a cuentas o datos ajenos, o eludir las medidas de seguridad.</li>
        <li>Sobrecargar el servicio, automatizar peticiones masivas o usarlo para atacar a terceros.</li>
        <li>Introducir contenido ilícito, ofensivo o que vulnere derechos de terceros en nombres, equipos o notas.</li>
      </ul>
      <p>El incumplimiento puede suponer la suspensión o el borrado de la cuenta.</p>

      <h2>6. Tu contenido</h2>
      <p>
        Los equipos y notas que creas son tuyos. Solo los usamos para prestarte el servicio y no son visibles para otros usuarios. Eres
        responsable de lo que escribes en ellos.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        VGC Tools es un proyecto no oficial, sin ánimo de lucro, y no está afiliado, patrocinado ni respaldado por Nintendo, Creatures Inc.,
        GAME FREAK inc. ni The Pokémon Company. Pokémon y todos los nombres, imágenes y marcas asociados pertenecen a sus respectivos
        titulares.
      </p>
      <p>
        Los datos de juego, las imágenes de los Pokémon y las repeticiones proceden de Pokémon Showdown; el motor de cálculo de daño es
        @smogon/calc (licencia MIT). Todos pertenecen a sus respectivos autores.
      </p>

      <h2>8. Responsabilidad</h2>
      <p>
        En la medida permitida por la ley, el titular no responde de los daños derivados del uso del servicio, de interrupciones, de la
        pérdida de datos ni de errores en los cálculos. Te recomendamos conservar una copia de tus equipos (puedes exportarlos en formato
        Showdown o descargar tus datos desde Usuario).
      </p>

      <h2>9. Cambios</h2>
      <p>
        Estos términos pueden actualizarse. Si el cambio es relevante, se avisará en la web; seguir usando el servicio supone aceptar la
        nueva versión.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española. Si eres consumidor, podrás acudir a los tribunales de tu domicilio conforme a
        la normativa de protección de los consumidores.
      </p>
    </article>
  );
}
