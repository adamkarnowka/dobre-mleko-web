import { useEffect, useRef, useState } from 'react';
import { loadGoogle, signInDev, signInWithGoogle, useMeta } from '../session';
import { useToast } from './Toast';

/** Google sign-in button, plus an e-mail form when the API allows development sign-in. */
export function SignIn() {
  const meta = useMeta();
  const toast = useToast();
  const button = useRef<HTMLDivElement>(null);
  const [devEmail, setDevEmail] = useState('');
  const clientId = meta.data?.google_web_client_id;

  useEffect(() => {
    if (!clientId || !button.current) return;
    let cancelled = false;
    loadGoogle()
      .then((google) => {
        if (cancelled || !button.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => signInWithGoogle(credential).catch(toast.fail),
        });
        google.accounts.id.renderButton(button.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          locale: 'pl',
          width: 280,
        });
      })
      .catch(toast.fail);
    return () => {
      cancelled = true;
    };
  }, [clientId, toast]);

  if (meta.isLoading) return <p className="label">Ładowanie…</p>;
  if (meta.isError) return <p>Serwer nie odpowiada. Spróbuj za chwilę.</p>;

  return (
    <div className="signin">
      {clientId ? (
        <div ref={button} />
      ) : (
        <p className="muted">
          Logowanie Google nie jest skonfigurowane (brak <code>GOOGLE_WEB_CLIENT_ID</code> w API).
        </p>
      )}
      {meta.data?.dev_login && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signInDev(devEmail.trim()).catch(toast.fail);
          }}
        >
          <span className="label">Logowanie deweloperskie</span>
          <label htmlFor="dev-email">E-mail</label>
          <input
            id="dev-email"
            type="email"
            required
            autoComplete="email"
            value={devEmail}
            onChange={(e) => setDevEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Zaloguj
          </button>
        </form>
      )}
    </div>
  );
}
