'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Event, Category } from '@/types';

export default function EventsPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (token) loadCategories();
  }, [token]);

  useEffect(() => {
    if (token) loadEvents();
  }, [token, search, categoryId, fromDate, toDate]);

  async function loadCategories() {
    try {
      const res = await api<{ data: Category[] }>('/categories', { token: token! });
      setCategories(res.data);
    } catch {}
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api<{ data: { data: Event[] } }>(`/events${qs}`, { token: token! });
      setEvents(res.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">Please log in to view events</p>
        <Link href="/login" className="text-primary-600 hover:underline">Sign In</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        {user && (user.role === 'admin' || user.role === 'organizer') && (
          <Link
            href="/events/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + Create Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-500">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const startDate = new Date(event.startTime);
  const dateStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/events/${event.id}`}
      className="bg-white rounded-xl border p-5 hover:shadow-lg transition group"
    >
      <div className="flex items-start justify-between mb-3">
        {event.category && (
          <span
            className="text-xs px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: event.category.colorHex || '#6b7280' }}
          >
            {event.category.name}
          </span>
        )}
        {event.status === 'archived' && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
            Archived
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition mb-2">
        {event.title}
      </h3>

      {event.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span></span>
          <span>{dateStr} at {timeStr}</span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-2">
            <span></span>
            <span>{event.venue.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span></span>
          <span>Capacity: {event.capacity}</span>
        </div>
      </div>
    </Link>
  );
}
