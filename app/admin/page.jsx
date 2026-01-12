/**
 * app/admin/page.jsx
 * Admin Dashboard Page
 */

import AdminDashboard from '../../components/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Content management and data synchronization dashboard'
};

export default function AdminPage() {
  return (
    <main>
      <AdminDashboard />
    </main>
  );
}
