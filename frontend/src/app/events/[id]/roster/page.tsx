'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface RosterEntry {
  registrationId: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  waitlistPosition: number | null;
  registeredAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
    semester?: string;
  };
}

interface Roster {
  eventId: string;
  summary: {
    confirmed: number;
    waitlisted: number;
    cancelled: number;
    total: number;
  };
  confirmed: RosterEntry[];
  waitlisted: RosterEntry[];
  cancelled: RosterEntry[];
}

function RosterContent() {
  const params = useParams();
  const { token, user } = useAuth();
  const eventId = params.id as string;
  const [roster, setRoster] = useState<Roster | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) loadRoster();
  }, [token, eventId]);

  async function loadRoster() {
    try {
      const [rosterRes, eventRes] = await Promise.all([
        api<{ data: Roster }>(`/registrations/event/${eventId}/roster`, { token: token! }),
        api<{ data: { title: string } }>(`/events/${eventId}`, { token: token! }),
      ]);
      setRoster(rosterRes.data);
      setEventTitle(eventRes.data.title);
    } catch (err: any) {
      setError(err.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }

  if (user && user.role !== 'admin' && user.role !== 'organizer') {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Admin/Organizer access only</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!roster) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href={`/events/${eventId}`} className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to event
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-1">Event Roster</h1>
      <p className="text-gray-500 mb-6">{eventTitle}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Confirmed</p>
          <p className="text-3xl font-bold text-green-600">{roster.summary.confirmed}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Waitlisted</p>
          <p className="text-3xl font-bold text-yellow-600">{roster.summary.waitlisted}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-3xl font-bold text-gray-400">{roster.summary.cancelled}</p>
        </div>
      </div>

      {/* Confirmed */}
      <RosterSection
        title="Confirmed Attendees"
        entries={roster.confirmed}
        emptyText="No confirmed attendees yet"
      />

      {/* Waitlisted */}
      {roster.waitlisted.length > 0 && (
        <RosterSection
          title="Waitlist (FIFO)"
          entries={roster.waitlisted}
          emptyText=""
          showPosition
        />
      )}

      {/* Cancelled */}
      {roster.cancelled.length > 0 && (
        <details className="bg-white rounded-xl border p-5 mb-4">
          <summary className="cursor-pointer font-semibold text-gray-700">
            Cancelled ({roster.cancelled.length})
          </summary>
          <div className="mt-4">
            <RosterTable entries={roster.cancelled} />
          </div>
        </details>
      )}
    </div>
  );
}

function RosterSection({
  title,
  entries,
  emptyText,
  showPosition,
}: {
  title: string;
  entries: RosterEntry[];
  emptyText: string;
  showPosition?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <RosterTable entries={entries} showPosition={showPosition} />
      )}
    </div>
  );
}

function RosterTable({ entries, showPosition }: { entries: RosterEntry[]; showPosition?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left text-gray-500 uppercase text-xs">
            {showPosition && <th className="py-2 pr-4">#</th>}
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Department</th>
            <th className="py-2 pr-4">Semester</th>
            <th className="py-2">Registered</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => (
            <tr key={entry.registrationId} className="text-gray-700">
              {showPosition && <td className="py-3 pr-4 font-medium">{entry.waitlistPosition}</td>}
              <td className="py-3 pr-4 font-medium text-gray-900">{entry.user.name}</td>
              <td className="py-3 pr-4 text-gray-600">{entry.user.email}</td>
              <td className="py-3 pr-4">{entry.user.department || '-'}</td>
              <td className="py-3 pr-4">{entry.user.semester || '-'}</td>
              <td className="py-3 text-gray-500">
                {new Date(entry.registeredAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RosterPage() {
  return (
    <ProtectedRoute>
      <RosterContent />
    </ProtectedRoute>
  );
}
