import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, unwrap, type AllowedEmail } from '../shared/api';
import { Avatar } from '../shared/components/Avatar';
import { useToast } from '../shared/components/Toast';
import { ago } from '../shared/format';

const KEY = ['admin', 'allowed'];

export function People({ myEmail }: { myEmail: string }) {
  const list = useQuery({ queryKey: KEY, queryFn: () => unwrap(api.GET('/admin/allowed')) });
  if (list.isLoading) return <p className="label">Ładowanie…</p>;
  if (!list.data) return null;
  const items = list.data.items;
  const joined = items.filter((i) => i.user).length;
  return (
    <section aria-label="Ludzie">
      <AddPerson />
      <p className="label">
        {items.length} na liście · {list.data.admins} admin(ów) · {joined} zalogowało się · {items.length - joined}{' '}
        czeka
      </p>
      <div className="table-wrap panel">
        <table className="people">
          <thead>
            <tr>
              <th scope="col">Osoba</th>
              <th scope="col">Rola</th>
              <th scope="col">Notatka</th>
              <th scope="col">Aktywność</th>
              <th scope="col">
                <span className="visually-hidden">Akcje</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <PersonRow key={p.email} person={p} isMe={p.email === myEmail} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AddPerson() {
  const client = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [note, setNote] = useState('');
  const add = useMutation({
    mutationFn: () => unwrap(api.POST('/admin/allowed', { body: { email, role, note: note.trim() || null } })),
    onSuccess: (p) => {
      toast.ok(`Dodano ${p.email}. Może się już zalogować.`);
      setEmail('');
      setNote('');
      setRole('member');
      return client.invalidateQueries({ queryKey: KEY });
    },
    onError: toast.fail,
  });
  return (
    <form
      className="add-person panel"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <div className="field grow">
        <label htmlFor="add-email">E-mail Google</label>
        <input
          id="add-email"
          type="email"
          required
          placeholder="ola@gmail.com"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="add-role">Rola</label>
        <select id="add-role" value={role} onChange={(e) => setRole(e.target.value as 'member' | 'admin')}>
          <option value="member">Członek</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="field grow">
        <label htmlFor="add-note">Notatka</label>
        <input
          id="add-note"
          type="text"
          maxLength={200}
          placeholder="np. siostra Kuby"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={add.isPending}>
        Dodaj
      </button>
    </form>
  );
}

function PersonRow({ person: p, isMe }: { person: AllowedEmail; isMe: boolean }) {
  const client = useQueryClient();
  const toast = useToast();
  const locked = p.from_environment || isMe;
  const name = p.user?.display_name ?? p.email;
  const path = { params: { path: { email: p.email } } };
  const refresh = () => client.invalidateQueries({ queryKey: KEY });

  const update = useMutation({
    mutationFn: (body: { role?: 'member' | 'admin'; note?: string | null }) =>
      unwrap(api.PATCH('/admin/allowed/{email}', { ...path, body })),
    onSuccess: (_, body) => {
      toast.ok(body.role ? 'Zmieniono rolę.' : 'Zapisano notatkę.');
      return refresh();
    },
    onError: (err) => {
      toast.fail(err);
      return refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => unwrap(api.DELETE('/admin/allowed/{email}', path)),
    onSuccess: () => {
      toast.ok(`Usunięto ${name}.`);
      return refresh();
    },
    onError: toast.fail,
  });

  return (
    <tr>
      <td>
        <div className="person">
          <Avatar name={name} url={p.user?.avatar_url} ring={p.role === 'admin' ? 'admin' : undefined} />
          <div>
            <div className="person-name">
              {p.user?.display_name ?? 'Jeszcze się nie zalogował(a)'}
              {isMe && <span className="badge">Ty</span>}
              {p.from_environment && (
                <span className="badge badge-env" title="Ustawione w ADMIN_EMAILS">
                  ENV
                </span>
              )}
              {!p.user && <span className="badge badge-pending">Czeka</span>}
            </div>
            <div className="person-email">{p.email}</div>
          </div>
        </div>
      </td>
      <td>
        <select
          aria-label={`Rola: ${p.email}`}
          value={p.role}
          disabled={locked && p.role === 'admin'}
          title={locked && p.role === 'admin' ? 'Nie można zmienić' : undefined}
          onChange={(e) => update.mutate({ role: e.target.value as 'member' | 'admin' })}
        >
          <option value="member">Członek</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td>
        <input
          className="note-input"
          type="text"
          maxLength={200}
          aria-label={`Notatka: ${p.email}`}
          defaultValue={p.note ?? ''}
          onBlur={(e) => {
            const note = e.target.value.trim() || null;
            if (note !== p.note) update.mutate({ note });
          }}
        />
      </td>
      <td className="data">
        {p.user ? (
          <>
            {p.user.places} miejsc · {p.user.ratings} ocen
            <br />
            ostatnio {ago(p.user.last_seen_at)}
          </>
        ) : (
          <>
            dodano {ago(p.created_at)}
            {p.added_by && (
              <>
                <br />
                przez {p.added_by.display_name}
              </>
            )}
          </>
        )}
      </td>
      <td>
        <button
          type="button"
          className="btn btn-danger btn-small"
          disabled={locked || remove.isPending}
          title={p.from_environment ? 'Ustawione w ADMIN_EMAILS' : isMe ? 'To Ty' : undefined}
          onClick={() => {
            if (confirm(`Usunąć ${name} z listy? Straci dostęp od razu. Jego miejsca i oceny zostaną.`))
              remove.mutate();
          }}
        >
          Usuń
        </button>
      </td>
    </tr>
  );
}
