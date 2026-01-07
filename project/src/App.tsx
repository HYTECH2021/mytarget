import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerDashboard } from './components/SellerDashboard';
import { NicheLandingPage } from './components/NicheLandingPage';
import { AuthModal } from './components/AuthModal';
import type { UserRole } from './lib/types';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('buyer');
  const [nicheParams, setNicheParams] = useState<{ category?: string; location?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const location = params.get('location');

    if (category) {
      setNicheParams({ category, location: location || undefined });
    }
  }, []);

  const handleGetStarted = (role: UserRole) => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!user || !profile) {
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
        <LandingPage onGetStarted={handleGetStarted} />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialRole={authRole}
        />
      </>
    );
  }

  if (profile.role === 'buyer') {
    return <BuyerDashboard />;
  }

  return <SellerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
