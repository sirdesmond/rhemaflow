import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./useAuth";
import {
  initRevenueCat,
  getSubscriptionTier,
  onSubscriptionChange,
} from "../services/subscription";
import { functions } from "../services/firebase";
import { SubscriptionTier, UsageStatus } from "../types";

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isPro: boolean;
  usage: UsageStatus | null;
  loading: boolean;
  refreshUsage: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: "free",
  isPro: false,
  usage: null,
  loading: true,
  refreshUsage: async () => {},
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const fn = functions.httpsCallable("getUsageStatus");
      const result = await fn();
      setUsage(result.data as UsageStatus);
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTier("free");
      setUsage(null);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        // Anonymous users are always free — skip RevenueCat
        if (!user.isAnonymous) {
          await initRevenueCat(user.uid);
          const currentTier = await getSubscriptionTier();
          setTier(currentTier);

          unsubscribe = onSubscriptionChange((newTier) => {
            setTier(newTier);
          });
        }

        await fetchUsage();
      } catch (error) {
        console.error("Subscription init error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      unsubscribe?.();
    };
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isPro: tier === "pro",
        usage,
        loading,
        refreshUsage: fetchUsage,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
