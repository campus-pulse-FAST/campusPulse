'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Category, Venue, Event } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function toLocalDateTimeInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditEventContent() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const eventId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    venueId: '',
    startTime: '',
    endTime: '',
    capacity: 50,
    status: 'published',
    isPublic: true,
    registrationDeadline: '',
  });

  useEffect(() => {
    if (token) loadData();
  }, [token, eventId]);

  async function loadData() {
    try {
      const [eventRes, catsRes, venuesRes] = await Promise.all([
        api<{ data: Event }>(`/events/${eventId}`, { token: token! }),
        api<{ data: Category[] }>('/categories', { token: token! }),
        api<{ data: Venue[] }>('/venues', { token: token! }),
      ]);

      const e = eventRes.data;
      setEvent(e);
      setCategories(catsRes.data);
      setVenues(venuesRes.data);
      setFormData({
        title: e.title,
        description: e.description || '',
        categoryId: e.categoryId ? String(e.categoryId) : '',
        venueId: e.venueId ? String(e.venueId) : '',
        startTime: toLocalDateTimeInput(e.startTime),
        endTime: toLocalDateTimeInput(e.endTime),
        capacity: e.capacity,
        status: e.status,
        isPublic: e.isPublic,
        registrationDeadline: toLocalDateTimeInput(e.registrationDeadline),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        capacity: formData.capacity,
        status: formData.status,
        isPublic: formData.isPublic,
      };
      if (formData.categoryId) payload.categoryId = parseInt(formData.categoryId);
      if (formData.venueId) payload.venueId = parseInt(formData.venueId);
      if (formData.registrationDeadline) {
        payload.registrationDeadline = new Date(formData.registrationDeadline).toISOString();
      }

      await api(`/events/${eventId}`, {
        method: 'PUT',
        token: token!,
        body: JSON.stringify(payload),
      });

      router.push(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!event) return <div className="text-center py-20 text-red-600">Event not found</div>;

  const canEdit = user && (user.role === 'admin' || (user.role === 'organizer' && user.id === event.organizerId));
  if (!canEdit) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">You don&apos;t have permission to edit this event</p>
        <Link href={`/events/${eventId}`} className="text-primary-600 hover:underline">Back to event</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/events/${eventId}`} className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to event
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Event</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            name="title" type="text" required
            value={formData.title} onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description" rows={3}
            value={formData.description} onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="categoryId" value={formData.categoryId} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select
              name="venueId" value={formData.venueId} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">No venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name} (cap: {v.capacity})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              name="startTime" type="datetime-local" required
              value={formData.startTime} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input
              name="endTime" type="datetime-local" required
              value={formData.endTime} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
            <input
              name="capacity" type="number" required min={1}
              value={formData.capacity} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
            <input
              name="registrationDeadline" type="datetime-local"
              value={formData.registrationDeadline} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status" value={formData.status} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2">
              <input
                name="isPublic" type="checkbox"
                checked={formData.isPublic} onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Public event</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href={`/events/${eventId}`}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <ProtectedRoute>
      <EditEventContent />
    </ProtectedRoute>
  );
}
