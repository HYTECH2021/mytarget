import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Subscription, SubscriptionPlan } from '../lib/types';

export interface DailyLimits {
  plan: SubscriptionPlan;
  targets_viewed: number;
  targets_limit: number;
  offers_sent: number;
  offers_limit: number;
  can_view_more_targets: boolean;
  can_send_more_offers: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailyLimits, setDailyLimits] = useState<DailyLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
      loadDailyLimits();
    } else {
      setSubscription(null);
      setDailyLimits(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const defaultSub: Subscription = {
          id: '',
          user_id: user.id,
          plan: 'free',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSubscription(defaultSub);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_daily_limits', {
        user_uuid: user.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDailyLimits(data[0]);
      }
    } catch (error) {
      console.error('Error loading daily limits:', error);
    }
  };

  const upgradePlan = async (newPlan: SubscriptionPlan) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingSub) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan: newPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan: newPlan,
            status: 'active',
            started_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      await loadSubscription();
      await loadDailyLimits();

      return { success: true };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false, error: 'Failed to upgrade plan' };
    }
  };

  const checkCanViewTargets = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_daily_targets_limit', {
        user_uuid: user.id,
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking targets limit:', error);
      return false;
    }
  };

  const checkCanSendOffers = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_daily_offers_limit', {
        user_uuid: user.id,
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking offers limit:', error);
      return false;
    }
  };

  const incrementTargetsViewed = async () => {
    if (!user) return;

    try {
      await supabase.rpc('increment_targets_viewed', {
        user_uuid: user.id,
      });

      await loadDailyLimits();
    } catch (error) {
      console.error('Error incrementing targets viewed:', error);
    }
  };

  const incrementOffersSent = async () => {
    if (!user) return;

    try {
      await supabase.rpc('increment_offers_sent', {
        user_uuid: user.id,
      });

      await loadDailyLimits();
    } catch (error) {
      console.error('Error incrementing offers sent:', error);
    }
  };

  return {
    subscription,
    dailyLimits,
    loading,
    upgradePlan,
    checkCanViewTargets,
    checkCanSendOffers,
    incrementTargetsViewed,
    incrementOffersSent,
    refreshLimits: loadDailyLimits,
  };
}
