import { ProfileScreen } from '@/src/components/ProfileScreen';
import { DashboardScreen } from '@/src/components/DashboardShell';

export default function BuyerProfileTab() {
  return (
    <DashboardScreen>
      <ProfileScreen role="buyer" />
    </DashboardScreen>
  );
}
