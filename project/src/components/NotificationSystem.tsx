import { useEffect, useState } from 'react';
import { Bell, MessageCircle, Target, TrendingUp, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { registerServiceWorker, subscribeToPush } from '../utils/pushNotifications';

interface Notification {
  id: string;
  type: 'message' | 'offer' | 'target';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Helper function to get user target IDs (will be populated by component)
let userTargetIds: string[] = [];

function getUserTargetIds(userId: string): string {
  return userTargetIds.join(',') || 'null';
}

export function NotificationSystem() {
  const { profile, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user target IDs and initialize push notifications
  useEffect(() => {
    if (!profile || !user) return;

    // Load target IDs for buyer
    if (profile.role === 'buyer') {
      supabase
        .from('targets')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .then(({ data }) => {
          if (data) {
            userTargetIds = data.map((t) => t.id);
          }
        });
    }

    // Register service worker and subscribe to push if notifications enabled
    if (profile.notifications_enabled) {
      initializePushNotifications(user.id);
    }
  }, [profile, user]);

  useEffect(() => {
    if (!profile) return;

    const messageChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          if (payload.new.sender_id !== profile.id) {
            addNotification({
              id: payload.new.id,
              type: 'message',
              title: 'Nuovo Messaggio',
              message: 'Hai ricevuto un nuovo messaggio in una negoziazione',
              timestamp: new Date(payload.new.created_at),
              read: false
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `target_id=in.(${getUserTargetIds(profile.id)})`, // Only notify for buyer's targets
        },
        async (payload: any) => {
          // Check if offer is for this buyer's target
          const { data: targetData } = await supabase
            .from('targets')
            .select('user_id')
            .eq('id', payload.new.target_id)
            .maybeSingle();

          if (targetData && targetData.user_id === profile.id) {
            addNotification({
              id: payload.new.id,
              type: 'offer',
              title: 'Nuova Offerta',
              message: 'Hai ricevuto una nuova offerta per il tuo target',
              timestamp: new Date(payload.new.created_at),
              read: false
            });

            // Send Web Push notification if enabled
            await sendPushNotification({
              title: 'Nuova Offerta',
              body: 'Nuova offerta disponibile. Clicca per vedere i dettagli.',
              url: `/?offer=${payload.new.id}`,
            });
          }
        }
      );

    // Subscribe to new targets for sellers
    if (profile.role === 'seller' && profile.notifications_enabled) {
      messageChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'targets',
          filter: 'status=eq.active',
        },
        async (payload: any) => {
          const newTarget = payload.new;
          
          // Check if seller is interested in this category
          // Match by primary_sector or notify all if primary_sector is null
          const isInterested = !profile.primary_sector || 
                              profile.primary_sector === newTarget.category ||
                              profile.primary_sector === '';

          if (isInterested) {
            addNotification({
              id: newTarget.id,
              type: 'target',
              title: 'Nuova Opportunità',
              message: `Nuova opportunità nella categoria ${newTarget.category}!`,
              timestamp: new Date(newTarget.created_at),
              read: false
            });

            // Send Web Push notification
            await sendPushNotification({
              title: 'Nuovo Target rilevato',
              body: `Nuovo Target rilevato: ${newTarget.category}. Clicca per rispondere.`,
              url: `/?target=${newTarget.id}`,
            });
          }
        }
      );
    }

    messageChannel.subscribe();

    return () => {
      messageChannel.unsubscribe();
    };
  }, [profile]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Initialize push notifications
  const initializePushNotifications = async (userId: string) => {
    try {
      const registration = await registerServiceWorker();
      if (registration) {
        await subscribeToPush(registration, userId);
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  // Send push notification via service worker
  const sendPushNotification = async (data: { title: string; body: string; url?: string }) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(data.title, {
        body: data.body,
        icon: '/target-icon.png',
        badge: '/target-icon.png',
        tag: 'new-offer',
        data: data.url || '/',
      });
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);

    // Also show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/target-icon.png',
        badge: '/target-icon.png',
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-orange-400" />;
      case 'offer':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'target':
        return <Target className="w-5 h-5 text-orange-400" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-3 rounded-2xl bg-orange-100 hover:bg-orange-200 text-orange-600 hover:text-orange-700 transition-all border border-orange-300 hover:scale-105 active:scale-95"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xs font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {showPanel && (
        <>
          <div
            onClick={() => setShowPanel(false)}
            className="fixed inset-0 z-40 transition-opacity duration-200"
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-orange-600/30 rounded-3xl shadow-2xl shadow-orange-600/20 overflow-hidden z-50 transition-all duration-300">
              <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-b border-orange-600/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Notifiche</h3>
                    <p className="text-xs text-slate-400">{unreadCount} non lette</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Segna tutte
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Nessuna notifica</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-all duration-300 cursor-pointer ${
                        !notification.read ? 'bg-orange-600/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          !notification.read ? 'bg-orange-600/20' : 'bg-slate-800/50'
                        }`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-bold ${
                              !notification.read ? 'text-white' : 'text-slate-400'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-slate-600 mt-2">
                            {notification.timestamp.toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
    </>
  );
}
