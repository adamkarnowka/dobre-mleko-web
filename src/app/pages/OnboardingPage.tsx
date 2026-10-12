import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap, type Me } from '../../shared/api';
import { Brand } from '../../shared/components/Brand';
import { useToast } from '../../shared/components/Toast';
import { signOut } from '../../shared/session';
import { ProfileForm } from '../components/ProfileForm';

/** First sign-in: name, badge and favourite categories (POST /me/profile). */
export function OnboardingPage({ me }: { me: Me }) {
  const client = useQueryClient();
  const toast = useToast();
  const finish = useMutation({
    mutationFn: (body: { display_name: string; badge: string; favorite_categories: Me['favorite_categories'] }) =>
      unwrap(api.POST('/me/profile', { body: { ...body, badge: body.badge || null } })),
    onSuccess: () => client.invalidateQueries({ queryKey: ['me'] }),
    onError: toast.fail,
  });
  return (
    <main className="page narrow onboarding">
      <Brand />
      <h1 className="display">Witaj w sieci</h1>
      <p>Jeszcze tylko kilka słów o Tobie — tak zobaczą Cię znajomi.</p>
      <ProfileForm me={me} submitLabel="Wchodzę" busy={finish.isPending} onSubmit={(d) => finish.mutate(d)} />
      <button type="button" className="link-button" onClick={signOut}>
        To nie ja — wyloguj
      </button>
    </main>
  );
}
