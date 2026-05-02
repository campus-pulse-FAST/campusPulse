'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminContent() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ events: 0, venues: 0, categories: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === 'admin') loadStats();
  }, [token, user]);

  async function loadStats() {
    try {
      const [events, venues, categories, users] = await Promise.all([
        api<{ data: { meta: { total: number } } }>('/events?limit=1', { token: token! }),
        api<{ data: any[] }>('/venues', { token: token! }),
        api<{ data: any[] }>('/categories', { token: token! }),
        api<{ data: { meta: { total: number } } }>('/users?limit=1', { token: token! }),
      ]);
      setStats({
        events: events.data.meta?.total || 0,
        venues: venues.data?.length || 0,
        categories: categories.data?.length || 0,
        users: users.data.meta?.total || 0,
      });
    } catch {}
    setLoading(false);
  }

  if (user && user.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Admin access only</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
      <p className="text-gray-500 mb-8">Manage events, venues, categories, and users</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Events" value={stats.events} loading={loading} color="bg-blue-50 text-blue-700" />
        <StatCard label="Venues" value={stats.venues} loading={loading} color="bg-purple-50 text-purple-700" />
        <StatCard label="Categories" value={stats.categories} loading={loading} color="bg-pink-50 text-pink-700" />
        <StatCard label="Users" value={stats.users} loading={loading} color="bg-green-50 text-green-700" />
      </div>

      {/* Management cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminCard
          title="Manage Events"
          description="Create, edit, and archive events. View all statuses including drafts."
          href="/events"
          action="View all events →"
        />
        <AdminCard
          title="Manage Venues"
          description="Add new venues, set capacities, manage amenities."
          href="/admin/venues"
          action="Manage venues →"
        />
        <AdminCard
          title="Manage Categories"
          description="Create event categories with colors for filtering."
          href="/admin/categories"
          action="Manage categories →"
        />
        <AdminCard
          title="Manage Users"
          description="View users, change roles (student/organizer/admin)."
          href="/admin/users"
          action="Manage users →"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, color }: { label: string; value: number; loading: boolean; color: string }) {
  return (
    <div className={`${color} rounded-xl p-5 border border-current/10`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{loading ? '...' : value}</p>
    </div>
  );
}

function AdminCard({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border p-6 hover:shadow-md hover:border-primary-300 transition group">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <span className="text-sm text-primary-600 group-hover:underline font-medium">{action}</span>
    </Link>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
