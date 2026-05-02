'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Venue } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminVenuesContent() {
  const { token, user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '', capacity: 50, amenities: '' });

  useEffect(() => {
    if (token && user?.role === 'admin') loadVenues();
  }, [token, user]);

  async function loadVenues() {
    try {
      const res = await api<{ data: Venue[] }>('/venues', { token: token! });
      setVenues(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditing(null);
    setFormData({ name: '', location: '', capacity: 50, amenities: '' });
    setShowForm(true);
  }

  function startEdit(v: Venue) {
    setEditing(v);
    setFormData({
      name: v.name,
      location: v.location || '',
      capacity: v.capacity,
      amenities: (v.amenities || []).join(', '),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        location: formData.location || undefined,
        capacity: formData.capacity,
        amenities: formData.amenities ? formData.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await api(`/venues/${editing.id}`, { method: 'PUT', token: token!, body: JSON.stringify(payload) });
      } else {
        await api('/venues', { method: 'POST', token: token!, body: JSON.stringify(payload) });
      }
      setShowForm(false);
      loadVenues();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this venue?')) return;
    try {
      await api(`/venues/${id}`, { method: 'DELETE', token: token! });
      loadVenues();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (user && user.role !== 'admin') {
    return <div className="text-center py-20 text-gray-600">Admin access only</div>;
  }

  return (
    <div>
      <Link href="/admin" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to admin
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Venues</h1>
        <button onClick={startCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          + New Venue
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">{editing ? 'Edit Venue' : 'New Venue'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
              <input
                type="number" required min={1} value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
              <input
                value={formData.amenities}
                placeholder="projector, AC, sound system"
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : venues.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border text-gray-500">No venues yet</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Location</th>
                <th className="text-left py-3 px-4">Capacity</th>
                <th className="text-left py-3 px-4">Amenities</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {venues.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 px-4 font-medium text-gray-900">{v.name}</td>
                  <td className="py-3 px-4 text-gray-600">{v.location || '-'}</td>
                  <td className="py-3 px-4 text-gray-700">{v.capacity}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {(v.amenities || []).join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => startEdit(v)} className="text-primary-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminVenuesPage() {
  return (
    <ProtectedRoute>
      <AdminVenuesContent />
    </ProtectedRoute>
  );
}
