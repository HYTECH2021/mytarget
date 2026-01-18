import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { useIsAdmin } from './useIsAdmin';
import type { SubscriptionPlan } from '../lib/types';

export function useFeatureAccess() {
  const { profile } = useAuth();
  const { subscription } = useSubscription();
  const { isAdmin } = useIsAdmin();

  const currentPlan: SubscriptionPlan = subscription?.plan || 'free';

  const hasFeature = (feature: 'stats' | 'forecast_ai' | 'priority_chat' | 'advanced_export'): boolean => {
    // Admin ha accesso a tutto
    if (isAdmin) return true;

    // Controlla in base al piano
    switch (feature) {
      case 'stats':
        // Stats disponibili per Plus, Pro, Enterprise
        return currentPlan === 'plus' || currentPlan === 'pro' || currentPlan === 'enterprise';
      
      case 'forecast_ai':
        // Forecast AI solo per Pro e Enterprise
        return currentPlan === 'pro' || currentPlan === 'enterprise';
      
      case 'priority_chat':
        // Chat prioritarie solo per Pro e Enterprise
        return currentPlan === 'pro' || currentPlan === 'enterprise';
      
      case 'advanced_export':
        // Export avanzato (PDF, XLS) solo per Pro e Enterprise
        return currentPlan === 'pro' || currentPlan === 'enterprise';
      
      default:
        return false;
    }
  };

  const canAccessStats = hasFeature('stats');
  const canAccessForecastAI = hasFeature('forecast_ai');
  const canAccessPriorityChat = hasFeature('priority_chat');
  const canAccessAdvancedExport = hasFeature('advanced_export');

  return {
    currentPlan,
    hasFeature,
    canAccessStats,
    canAccessForecastAI,
    canAccessPriorityChat,
    canAccessAdvancedExport,
    isAdmin,
  };
}
