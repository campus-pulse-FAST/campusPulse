'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Event, Registration } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) loadData();
  }, [token, eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const [eventRes, regRes] = await Promise.all([
        api<{ data: Event }>(`/events/${eventId}`, { token: token! }),
        api<{ data: Registration | null }>(`/registrations/event/${eventId}/check`, { token: token! }).catch(() => ({ data: null })),
      ]);
      setEvent(eventRes.data);
      setRegistration(regRes.data && regRes.data.status !== 'cancelled' ? regRes.data : null);
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api<{ data: Registration }>('/registrations', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ eventId }),
      });
      setRegistration(res.data);
      if (res.data.status === 'waitlisted') {
        setSuccess(`You've been waitlisted at position #${res.data.waitlistPosition}`);
      } else {
        setSuccess('Successfully registered!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!registration) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api(`/registrations/${registration.id}`, {
        method: 'DELETE',
        token: token!,
      });
      setRegistration(null);
      setSuccess('Registration cancelled');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Cancel this event? It will be marked as cancelled.')) return;
    setActionLoading(true);
    try {
      await api(`/events/${eventId}`, { method: 'DELETE', token: token! });
      router.push('/events');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">Event not found</p>
        <Link href="/events" className="text-primary-600 hover:underline"> Back to events</Link>
      </div>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const isPast = endDate < new Date();
  const isPastDeadline = deadline && deadline < new Date();
  const canEdit = user && (user.role === 'admin' || (user.role === 'organizer' && user.id === event.organizerId));
  const isAdminOrOrganizer = user && (user.role === 'admin' || user.role === 'organizer');

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/events" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to events
      </Link>

      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-10 text-white">
          <div className="flex flex-wrap gap-2 mb-3">
            {event.category && (
              <span
                className="text-xs px-3 py-1 rounded-full bg-white/20"
                style={{ backgroundColor: event.category.colorHex || 'rgba(255,255,255,0.2)' }}
              >
                {event.category.name}
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full bg-white/20 capitalize">
              {event.status}
            </span>
            {!event.isPublic && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/20">Private</span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          {event.description && <p className="text-primary-100">{event.description}</p>}
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
          )}

          {/* Event details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">When</h3>
              <p className="text-gray-900">
                {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-600">
                {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} —{' '}
                {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {event.venue && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Where</h3>
                <p className="text-gray-900">{event.venue.name}</p>
                {event.venue.location && (
                  <p className="text-sm text-gray-600">{event.venue.location}</p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Capacity</h3>
              <p className="text-gray-900">{event.capacity} attendees</p>
            </div>

            {deadline && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Registration Deadline</h3>
                <p className={`${isPastDeadline ? 'text-red-600' : 'text-gray-900'}`}>
                  {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' at '}
                  {deadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>

          {/* Registration / Action buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t">
            {!isPast && event.status === 'published' && (
              registration ? (
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-lg font-medium ${
                    registration.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {registration.status === 'confirmed'
                      ? 'Registered'
                      : `Waitlisted (#${registration.waitlistPosition})`}
                  </span>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={actionLoading || !!isPastDeadline}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {actionLoading ? 'Registering...' : isPastDeadline ? 'Deadline passed' : 'Register'}
                </button>
              )
            )}

            {isAdminOrOrganizer && (
              <Link
                href={`/events/${event.id}/roster`}
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
              >
                View Roster
              </Link>
            )}

            {canEdit && (
              <>
                <Link
                  href={`/events/${event.id}/edit`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Edit
                </Link>
                {user?.role === 'admin' && event.status !== 'cancelled' && (
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    Cancel Event
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}
