import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as InAppPurchases from 'expo-in-app-purchases';

interface SubscriptionContextProps {
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  purchaseSubscription: () => void;
  restorePurchases: () => void;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return context;
};

const SUBSCRIPTION_PRODUCT_ID = 'mindfulpet_premium'; // Update with your real product ID

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to the store and check purchase status
    const init = async () => {
      await InAppPurchases.connectAsync();
      const { responseCode, results } = await InAppPurchases.getProductsAsync([SUBSCRIPTION_PRODUCT_ID]);
      // TODO: Check purchase history and set isSubscribed accordingly
      setLoading(false);
    };
    init();
    return () => { InAppPurchases.disconnectAsync(); };
  }, []);

  const purchaseSubscription = async () => {
    await InAppPurchases.purchaseItemAsync(SUBSCRIPTION_PRODUCT_ID);
  };

  const restorePurchases = async () => {
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    // TODO: Validate receipts and set isSubscribed if found
  };

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, setIsSubscribed, purchaseSubscription, restorePurchases, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
