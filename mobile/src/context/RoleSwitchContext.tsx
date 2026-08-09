import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { RoleSwitchOverlay } from '@/src/components/RoleSwitchOverlay';
import { useAuth } from '@/src/context/AuthContext';
import type { UserRole } from '@/src/types/auth';

type RoleSwitchContextValue = {
  switchRole: (role: UserRole) => Promise<void>;
  switching: boolean;
};

const RoleSwitchContext = createContext<RoleSwitchContextValue | null>(null);

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function RoleSwitchProvider({ children }: { children: ReactNode }) {
  const { setRole } = useAuth();
  const [visible, setVisible] = useState(false);
  const [targetRole, setTargetRole] = useState<UserRole>('seller');
  const [stage, setStage] = useState(1);
  const [switching, setSwitching] = useState(false);

  const switchRole = useCallback(
    async (nextRole: UserRole) => {
      if (switching) return;

      setSwitching(true);
      setTargetRole(nextRole);
      setStage(1);
      setVisible(true);

      const apiPromise = setRole(nextRole).then(
        (user) => ({ ok: true as const, user }),
        (error: unknown) => ({ ok: false as const, error }),
      );

      try {
        if (nextRole === 'seller') {
          const [, result] = await Promise.all([
            (async () => {
              await delay(900);
              setStage(2);
              await delay(1000);
              setStage(3);
            })(),
            apiPromise,
          ]);

          if (!result.ok) {
            throw result.error instanceof Error
              ? result.error
              : new Error('Failed to switch role');
          }

          // Let the listing card settle briefly before the ready beat.
          await delay(500);
          setStage(4);
          await delay(1200);
        } else {
          const [, result] = await Promise.all([
            (async () => {
              await delay(800);
              setStage(2);
            })(),
            apiPromise,
          ]);

          if (!result.ok) {
            throw result.error instanceof Error
              ? result.error
              : new Error('Failed to switch role');
          }

          await delay(700);
          setStage(3);
          await delay(1100);
        }

        router.replace(nextRole === 'buyer' ? '/(buyer)/(tabs)' : '/(seller)/(tabs)');
        await delay(180);
        setVisible(false);
        setStage(1);
      } catch (error) {
        setVisible(false);
        setStage(1);
        throw error;
      } finally {
        setSwitching(false);
      }
    },
    [setRole, switching],
  );

  const value = useMemo(
    () => ({
      switchRole,
      switching,
    }),
    [switchRole, switching],
  );

  return (
    <RoleSwitchContext.Provider value={value}>
      {children}
      <RoleSwitchOverlay visible={visible} targetRole={targetRole} stage={stage} />
    </RoleSwitchContext.Provider>
  );
}

export function useRoleSwitch() {
  const context = useContext(RoleSwitchContext);

  if (!context) {
    throw new Error('useRoleSwitch must be used within RoleSwitchProvider');
  }

  return context;
}
