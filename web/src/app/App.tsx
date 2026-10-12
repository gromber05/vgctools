import { lazy, Suspense } from 'react';
import { Empty } from '@/components/ui';
import { AuthPage } from '@/features/auth/AuthPage';
import { PrivacyPage } from '@/features/legal/PrivacyPage';
import { TermsPage } from '@/features/legal/TermsPage';
import { TeamPage } from '@/features/team/TeamPage';
import { TeamsPage } from '@/features/teams/TeamsPage';
import { UserPage } from '@/features/user/UserPage';
import { useAccount, type Account } from '@/state/useAccount';
import { useReplayLoader, type LoadReplays } from '@/state/useReplayLoader';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { CookieBanner } from './CookieBanner';
import { useRoute, type Route } from './router';

const CalcPage = lazy(() => import('@/features/calc/CalcPage').then((m) => ({ default: m.CalcPage })));

export function App() {
  const account = useAccount();
  const [route, go] = useRoute();
  const [loading, loadReplays] = useReplayLoader(account.state.names, account.update);

  return (
    <div className="app">
      <AppHeader account={account} route={route} loadingCount={loading.size} />
      <main className="main">
        {route.page === 'privacy' && <PrivacyPage />}
        {route.page === 'terms' && <TermsPage />}
        {!isLegal(route) && account.status === 'anon' && <AuthPage onSubmit={account.signIn} />}
        {!isLegal(route) && account.status === 'loading' && <p className="page muted">Cargando tus equipos…</p>}
        {!isLegal(route) && account.status === 'error' && (
          <div className="page">
            <Empty title="No se pudieron cargar tus equipos">
              <p>{account.loadError}</p>
              <button onClick={account.retry}>Reintentar</button>
            </Empty>
          </div>
        )}
        {!isLegal(route) && account.status === 'ready' && (
          <Page route={route} go={go} account={account} loading={loading} loadReplays={loadReplays} />
        )}
      </main>
      <AppFooter />
      <CookieBanner />
    </div>
  );
}

const isLegal = (route: Route) => route.page === 'privacy' || route.page === 'terms';

interface PageProps {
  route: Route;
  go: (route: Route) => void;
  account: Account;
  loading: Set<string>;
  loadReplays: LoadReplays;
}

function Page({ route, go, account, loading, loadReplays }: PageProps) {
  const { state, update } = account;

  if (route.page === 'calc')
    return (
      <Suspense fallback={<p className="page muted">Cargando la calculadora…</p>}>
        <CalcPage teams={state.teams} />
      </Suspense>
    );
  if (route.page === 'user') return <UserPage account={account} />;

  const team = route.page === 'team' ? state.teams.find((t) => t.id === route.teamId) : undefined;
  if (route.page === 'team' && team) {
    return (
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
    );
  }
  return (
    <TeamsPage
      state={state}
      update={update}
      go={go}
      localTeams={account.localTeams}
      onImportLocal={account.importLocalTeams}
      onDismissLocal={account.dismissLocalTeams}
    />
  );
}
