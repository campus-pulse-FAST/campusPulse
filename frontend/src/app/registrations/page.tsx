'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Registration } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function MyRegistrationsContent() {
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  async function loadData() {
    try {
      const res = await api<{ data: Registration[] }>('/registrations/me', { token: token! });
      setRegistrations(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(registrationId: string) {
    if (!confirm('Cancel this registration?')) return;
    try {
      await api(`/registrations/${registrationId}`, { method: 'DELETE', token: token! });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  const upcoming = registrations.filter(
    (r) => r.event && new Date(r.event.endTime) > new Date() && r.status !== 'cancelled',
  );
  const past = registrations.filter(
    (r) => r.event && new Date(r.event.endTime) <= new Date(),
  );
  const cancelled = registrations.filter((r) => r.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Registrations</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {registrations.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500 mb-4">You haven&apos;t registered for any events yet</p>
          <Link href="/events" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block transition">
            Browse events
          </Link>
        </div>
      )}

      <Section title="Upcoming" registrations={upcoming} onCancel={handleCancel} cancellable />
      <Section title="Past Events" registrations={past} onCancel={handleCancel} />
      <Section title="Cancelled" registrations={cancelled} onCancel={handleCancel} />
    </div>
  );
}

function Section({
  title,
  registrations,
  onCancel,
  cancellable,
}: {
  title: string;
  registrations: Registration[];
  onCancel: (id: string) => void;
  cancellable?: boolean;
}) {
  if (registrations.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{title} ({registrations.length})</h2>
      <div className="space-y-3">
        {registrations.map((reg) => (
          <RegistrationCard key={reg.id} registration={reg} onCancel={onCancel} cancellable={cancellable} />
        ))}
      </div>
    </div>
  );
}

function RegistrationCard({
  registration,
  onCancel,
  cancellable,
}: {
  registration: Registration;
  onCancel: (id: string) => void;
  cancellable?: boolean;
}) {
  if (!registration.event) {
    return (
      <div className="bg-white rounded-xl border p-4 text-gray-500">
        Event details unavailable
      </div>
    );
  }

  const event = registration.event;
  const startDate = new Date(event.startTime);

  return (
    <div className="bg-white rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition">
      <div className="flex-1">
        <Link href={`/events/${event.id}`} className="block">
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition">
            {event.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' at '}
            {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          registration.status === 'confirmed'
            ? 'bg-green-100 text-green-700'
            : registration.status === 'waitlisted'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {registration.status === 'waitlisted'
            ? `Waitlist #${registration.waitlistPosition}`
            : registration.status}
        </span>

        {cancellable && (
          <button
            onClick={() => onCancel(registration.id)}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <ProtectedRoute>
      <MyRegistrationsContent />
    </ProtectedRoute>
  );
}
