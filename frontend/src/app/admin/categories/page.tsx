'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminCategoriesContent() {
  const { token, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', colorHex: '#3b82f6' });

  useEffect(() => {
    if (token && user?.role === 'admin') loadCategories();
  }, [token, user]);

  async function loadCategories() {
    try {
      const res = await api<{ data: Category[] }>('/categories', { token: token! });
      setCategories(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setEditing(null);
    setFormData({ name: '', description: '', colorHex: '#3b82f6' });
    setShowForm(true);
  }

  function startEdit(c: Category) {
    setEditing(c);
    setFormData({
      name: c.name,
      description: c.description || '',
      colorHex: c.colorHex || '#3b82f6',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = { name: formData.name, colorHex: formData.colorHex };
      if (formData.description) payload.description = formData.description;
      if (editing) {
        await api(`/categories/${editing.id}`, { method: 'PUT', token: token!, body: JSON.stringify(payload) });
      } else {
        await api('/categories', { method: 'POST', token: token!, body: JSON.stringify(payload) });
      }
      setShowForm(false);
      loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await api(`/categories/${id}`, { method: 'DELETE', token: token! });
      loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSeed() {
    try {
      await api('/categories/seed', { method: 'POST', token: token! });
      loadCategories();
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
        <div className="flex gap-2">
          <button onClick={handleSeed} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
            Seed Defaults
          </button>
          <button onClick={startCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            + New Category
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color" value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg w-32 font-mono text-sm"
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
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border text-gray-500">
          <p className="mb-3">No categories yet</p>
          <button onClick={handleSeed} className="text-primary-600 hover:underline">Seed default categories</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left py-3 px-4">Color</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.colorHex || '#6b7280' }} />
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{c.description || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => startEdit(c)} className="text-primary-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
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

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute>
      <AdminCategoriesContent />
    </ProtectedRoute>
  );
}
