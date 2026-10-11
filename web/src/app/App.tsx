import { Empty } from '@/components/ui';
import { AuthPage } from '@/features/auth/AuthPage';
import { TeamPage } from '@/features/team/TeamPage';
import { TeamsPage } from '@/features/teams/TeamsPage';
import { useAccount } from '@/state/useAccount';
import { useReplayLoader } from '@/state/useReplayLoader';
import { AppHeader } from './AppHeader';
import { useRoute } from './router';

export function App() {
  const account = useAccount();
  const { state, update } = account;
  const [route, go] = useRoute();
  const [loading, loadReplays] = useReplayLoader(state.names, update);
  const team = route.page === 'team' ? state.teams.find((t) => t.id === route.teamId) : undefined;

  return (
    <div className="app">
      <AppHeader account={account} loadingCount={loading.size} />
      <main className="main">
        {account.status === 'anon' && <AuthPage onSubmit={account.signIn} />}
        {account.status === 'loading' && <p className="page muted">Cargando tus equipos…</p>}
        {account.status === 'error' && (
          <div className="page">
            <Empty title="No se pudieron cargar tus equipos">
              <p>{account.loadError}</p>
              <button onClick={account.retry}>Reintentar</button>
            </Empty>
          </div>
        )}
        {account.status === 'ready' &&
          (route.page === 'team' && team ? (
            <TeamPage
              key={team.id}
              state={state}
              team={team}
              section={route.section}
              update={update}
              go={go}
              loading={loading}
              loadReplays={loadReplays}
            />
          ) : (
            <TeamsPage
              state={state}
              update={update}
              go={go}
              localTeams={account.localTeams}
              onImportLocal={account.importLocalTeams}
              onDismissLocal={account.dismissLocalTeams}
            />
          ))}
      </main>
    </div>
  );
}
