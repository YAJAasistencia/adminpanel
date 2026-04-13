import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Liquidaciones from '@/pages/Liquidaciones';
import Notificaciones from '@/pages/Notificaciones';
import Bonos from '@/pages/Bonos';
import Analytics from '@/pages/Analytics';
import Anuncios from '@/pages/Anuncios';
import Landing from '@/pages/Landing';
import DriverGuard from '@/components/landing/DriverGuard';
import DriverApp from '@/pages/DriverApp';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Pages that require mobile-only access
  const mobileOnlyPages = ["DriverApp"];

  // Render the main app
  return (
    <Routes>
      {/* /lp handled at root level above */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            mobileOnlyPages.includes(path) ? (
              <DriverGuard>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </DriverGuard>
            ) : (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            )
          }
        />
      ))}
      <Route path="/Analytics" element={<LayoutWrapper currentPageName="Analytics"><Analytics /></LayoutWrapper>} />
      <Route path="/Anuncios" element={<LayoutWrapper currentPageName="Anuncios"><Anuncios /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <Router>
      <Routes>
        {/* Public landing page - no auth needed */}
        <Route path="/" element={<Landing />} />
        <Route path="/Landing" element={<Landing />} />
        {/* Driver app - public, no base44 auth needed */}
        <Route path="/DriverApp" element={<QueryClientProvider client={queryClientInstance}><DriverGuard><DriverApp /></DriverGuard></QueryClientProvider>} />
        <Route path="/lp" element={<Navigate to="/DriverApp" replace />} />

        <Route
          path="/*"
          element={
            <AuthProvider>
              <QueryClientProvider client={queryClientInstance}>
                <NavigationTracker />
                <AuthenticatedApp />
                <Toaster />
              </QueryClientProvider>
            </AuthProvider>
          }
        />
      </Routes>
    </Router>
  );
}

export default App
