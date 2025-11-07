'use client';

import { type ReactNode, createContext, useRef, useContext, useEffect } from 'react';
import { useStore } from 'zustand';

import { type AppStore, createAppStore, initAppStore } from './app-store';
import { useRouter } from 'next/navigation';

export type AppStoreApi = ReturnType<typeof createAppStore>;

export const AppStoreContext = createContext<AppStoreApi | undefined>(undefined);

export interface AppStoreProviderProps {
  children: ReactNode;
}

export const AppStoreProvider = ({ children }: AppStoreProviderProps) => {
  const storeRef = useRef<AppStoreApi | undefined>(undefined);
  const router = useRouter();

  if (!storeRef.current) {
    storeRef.current = createAppStore(initAppStore());
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    const unsub = store.subscribe((state, prevState) => {
      if (state.isSwitchingPage !== prevState.isSwitchingPage) {
        if (!state.isSwitchingPage) {
          setTimeout(() => {
            router.push('/');
          }, 1000);

          setTimeout(() => {
            store.setState(prevState => ({ ...prevState, isSwitchingPage: true }));
          }, 1500);
        }
      }
    });

    return () => unsub();
  }, [router]);

  return <AppStoreContext.Provider value={storeRef.current}>{children}</AppStoreContext.Provider>;
};

export const useAppStore = <T,>(selector: (store: AppStore) => T): T => {
  const appStoreContext = useContext(AppStoreContext);

  if (!appStoreContext) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }

  return useStore(appStoreContext, selector);
};
