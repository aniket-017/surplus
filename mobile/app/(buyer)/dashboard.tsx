import { DashboardShell } from '@/src/components/DashboardShell';

export default function BuyerDashboardScreen() {
  return (
    <DashboardShell
      role="buyer"
      title="Buyer Dashboard"
      subtitle="Discover surplus inventory, track orders, and source industrial materials."
      stats={[
        { label: 'Active Orders', value: '0' },
        { label: 'Saved Listings', value: '0' },
        { label: 'Categories', value: '12' },
        { label: 'Messages', value: '0' },
      ]}
    />
  );
}
