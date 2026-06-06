import { ProfileScreen } from '@/src/components/ProfileScreen';
import { DashboardScreen } from '@/src/components/DashboardShell';

export default function SellerProfileTab() {
  return (
    <DashboardScreen>
      <ProfileScreen role="seller" />
    </DashboardScreen>
  );
}
