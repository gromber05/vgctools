import { LEGAL } from './legalInfo';

export function PrivacyPage() {
  return (
    <article className="page legal">
      <h1>Política de privacidad</h1>
      <p className="muted">Última actualización: {LEGAL.updated}</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        El responsable de los datos tratados en VGC Tools es {LEGAL.owner}. Puedes contactar para cualquier cuestión sobre privacidad en{' '}
        <b>{LEGAL.email}</b>.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>
          <b>Datos de la cuenta:</b> nombre de usuario, contraseña (guardada de forma cifrada e irreversible, nunca en claro), fecha de alta
          y fecha y versión de aceptación de estos textos.
        </li>
        <li>
          <b>Datos que introduces:</b> tus nombres de usuario de Pokémon Showdown, tus equipos, los enlaces a repeticiones que añadas y las
          notas que escribas.
        </li>
        <li>
          <b>Datos extraídos de las repeticiones:</b> resultado, Pokémon usados, movimientos y puntuación ELO. Las repeticiones de Pokémon
          Showdown son públicas e incluyen el nombre de usuario de tu rival, que también se guarda como parte de la partida.
        </li>
        <li>
          <b>Datos técnicos:</b> la dirección IP desde la que te conectas se usa en el momento para limitar los intentos de inicio de sesión
          y proteger el servicio. No se almacena en la base de datos.
        </li>
      </ul>
      <p>No pedimos correo electrónico, nombre real ni ningún otro dato identificativo.</p>

      <h2>3. Para qué y con qué base legal</h2>
      <ul>
        <li>
          <b>Prestarte el servicio</b> (crear tu cuenta, guardar tus equipos y calcular tus estadísticas): ejecución del acuerdo de uso que
          aceptas al registrarte (art. 6.1.b del RGPD).
        </li>
        <li>
          <b>Seguridad del servicio</b> (limitar intentos de acceso, prevenir abusos): interés legítimo (art. 6.1.f del RGPD).
        </li>
        <li>
          <b>Datos de rivales en las repeticiones</b>: interés legítimo en analizar tus propias partidas, que ya son públicas en Pokémon
          Showdown. Solo los ves tú. Si eres un jugador que aparece en las partidas de otro usuario y quieres que se retire tu nombre,
          escribe a {LEGAL.email}.
        </li>
      </ul>
      <p>No se usan tus datos para publicidad, ni se elaboran perfiles, ni se toman decisiones automatizadas sobre ti.</p>

      <h2>4. Cuánto tiempo se conservan</h2>
      <p>
        Mientras tengas la cuenta. Puedes borrarla en cualquier momento desde <b>Usuario → Borrar la cuenta</b>: se eliminan de inmediato tu
        cuenta, tus equipos y tus partidas. Las copias de seguridad, si existen, se sobrescriben en un plazo máximo de {LEGAL.backupDays}{' '}
        días.
      </p>

      <h2>5. Con quién se comparten</h2>
      <p>
        Tus datos no se venden ni se ceden a terceros. Se alojan en {LEGAL.hosting}, que actúa como encargado del tratamiento. Al estar
        fuera del Espacio Económico Europeo, esto supone una transferencia internacional de datos, que se ampara en las garantías del
        artículo 46 del RGPD (cláusulas contractuales tipo de la Comisión Europea) o, en su caso, en el Marco de Privacidad de Datos UE-EE.
        UU.
      </p>
      <p>
        Para funcionar, tu navegador se conecta directamente a servicios externos, que reciben tu dirección IP según sus propias políticas:
      </p>
      <ul>
        <li>
          <b>Pokémon Showdown</b> (play.pokemonshowdown.com y replay.pokemonshowdown.com): imágenes de los Pokémon y descarga de las
          repeticiones que añades.
        </li>
        <li>
          <b>pokepast.es</b>: solo si creas un equipo a partir de un enlace de pokepast.es.
        </li>
      </ul>

      <h2>6. Cookies y almacenamiento local</h2>
      <p>
        VGC Tools no usa cookies de publicidad ni de analítica. Guarda en tu navegador (almacenamiento local) el identificador de tu sesión,
        que es imprescindible para que sigas conectado y se borra al pulsar «Salir». Si lo aceptas en el aviso de cookies, también guarda
        los Pokémon y el campo que dejes en la calculadora, y tu elección para no volver a preguntarte. Esos datos no salen de tu navegador;
        puedes cambiar de opinión en «Preferencias de cookies», al pie de la página, y al rechazar se borran.
      </p>

      <h2>7. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento tus derechos de:</p>
      <ul>
        <li>
          <b>Acceso y portabilidad:</b> descarga todos tus datos desde <b>Usuario → Descargar mis datos</b>.
        </li>
        <li>
          <b>Rectificación:</b> edita tus datos directamente en la web.
        </li>
        <li>
          <b>Supresión:</b> borra tu cuenta desde <b>Usuario</b>.
        </li>
        <li>
          <b>Oposición y limitación:</b> escribiendo a {LEGAL.email}.
        </li>
      </ul>
      <p>
        Si consideras que no se han respetado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
          www.aepd.es
        </a>
        ).
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        Para crear una cuenta debes tener al menos {LEGAL.minAge} años. Si eres menor de {LEGAL.minAge}, necesitas el consentimiento de tu
        padre, madre o tutor, que debe contactar en {LEGAL.email}.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Las contraseñas se guardan cifradas con Argon2, las comunicaciones se realizan cifradas mediante HTTPS y el acceso a cada equipo
        está limitado a su propietario. Si detectas un problema de seguridad, escríbenos a {LEGAL.email}.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>Si esta política cambia de forma relevante, se avisará en la web. La fecha de la última actualización figura al principio.</p>
    </article>
  );
}
