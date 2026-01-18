import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { NicheLandingPage } from './components/NicheLandingPage';
import { AuthModal } from './components/AuthModal';
import { SupportChat } from './components/SupportChat';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { TerminiCondizioni } from './pages/TerminiCondizioni';
import { Contatti } from './pages/Contatti';
import { AdminDashboard } from './pages/AdminDashboard';
import { StatsDashboard } from './pages/StatsDashboard';
import { Pricing } from './pages/Pricing';
import { Success } from './pages/Success';
import { GlobalAIAssistant } from './components/GlobalAIAssistant';
import { NotificationConsent } from './components/NotificationConsent';
import type { UserRole } from './lib/types';

function AppContent() {
  const { user, profile, loading, error } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('buyer');
  const [guestMode, setGuestMode] = useState<UserRole | null>(null);
  const [nicheParams, setNicheParams] = useState<{ category?: string; location?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const location = params.get('location');

    if (category) {
      setNicheParams({ category, location: location || undefined });
    }
  }, []);

  // Gestione routing per pagine legali
  const currentPath = window.location.pathname;

  const handleGetStarted = (role: UserRole) => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const handleGuestMode = (role: UserRole) => {
    setGuestMode(role);
  };

  const handleAuthRequired = (role: UserRole) => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  // Gestione routing per pagine legali e admin
  if (currentPath === '/privacy') {
    return <PrivacyPolicy />;
  }
  
  if (currentPath === '/cookie-policy') {
    return <CookiePolicy />;
  }
  
  if (currentPath === '/termini') {
    return <TerminiCondizioni />;
  }
  
  if (currentPath === '/contatti') {
    return <Contatti />;
  }

  // Admin dashboard route
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminDashboard />;
  }

  // Stats dashboard route
  if (currentPath === '/stats' || currentPath.startsWith('/stats/')) {
    return <StatsDashboard />;
  }

  // Pricing page route
  if (currentPath === '/pricing') {
    return <Pricing />;
  }

  // Success page route (after Stripe checkout)
  if (currentPath === '/success') {
    return <Success />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-red-600 text-xl mb-4">Errore di configurazione</div>
          <div className="text-slate-600">{error}</div>
          <div className="text-slate-500 text-sm mt-4">
            Le variabili d'ambiente non sono configurate correttamente.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-slate-900 text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!user || !profile) {
    if (guestMode) {
      return (
        <>
          {guestMode === 'buyer' ? (
            <BuyerDashboard
              isGuest
              onAuthRequired={handleAuthRequired}
              onBack={() => setGuestMode(null)}
            />
          ) : (
            <SellerDashboard
              isGuest
              onAuthRequired={handleAuthRequired}
              onBack={() => setGuestMode(null)}
            />
          )}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialRole={authRole}
          />
        </>
      );
    }

    if (nicheParams?.category) {
      return (
        <NicheLandingPage
          category={nicheParams.category}
          location={nicheParams.location}
          onGetStarted={handleGetStarted}
        />
      );
    }

    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onGuestMode={handleGuestMode}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialRole={authRole}
        />
      </>
    );
  }

  console.log('User logged in:', { user: user.email, profile: profile.full_name, role: profile.role });

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  // Show notification consent if notifications_enabled is null (first time user)
  const showNotificationConsent = profile.notifications_enabled === null;

  return (
    <>
      {profile.role === 'buyer' ? (
        <BuyerDashboard onBack={handleBackToLanding} />
      ) : (
        <SellerDashboard onBack={handleBackToLanding} />
      )}
      <SupportChat />
      <GlobalAIAssistant />
      {showNotificationConsent && (
        <NotificationConsent
          onComplete={() => {
            // Component will refresh profile automatically
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
