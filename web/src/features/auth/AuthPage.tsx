import { useState } from 'react';

interface AuthPageProps {
  onSubmit: (mode: 'login' | 'register', username: string, password: string) => Promise<void>;
}

export function AuthPage({ onSubmit }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await onSubmit(mode, username, password);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-intro">
        <h1>Tus equipos y tus repeticiones, en un sitio.</h1>
        <p className="lede">
          Guarda tus equipos de VGC, pega tus repeticiones de Showdown y mira tu win% por Pokémon, por lead y contra cada rival.
        </p>
      </div>

      <form
        className="card auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>
            Crear cuenta
          </button>
        </div>
        <label className="field">
          <span>Usuario</span>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_.\-]+"
            title="Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo"
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {mode === 'register' && <span className="muted small">Mínimo 8 caracteres.</span>}
        </label>
        {error && <p className="error small">{error}</p>}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
