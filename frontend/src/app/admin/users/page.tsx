'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function AdminUsersContent() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token && currentUser?.role === 'admin') loadUsers(1);
  }, [token, currentUser]);

  async function loadUsers(page: number) {
    setLoading(true);
    try {
      const res = await api<{ data: { data: User[]; meta: typeof meta } }>(`/users?page=${page}&limit=20`, { token: token! });
      setUsers(res.data.data || []);
      setMeta(res.data.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    setError('');
    setSuccess('');
    try {
      await api(`/users/${userId}/role`, {
        method: 'PATCH',
        token: token!,
        body: JSON.stringify({ role }),
      });
      setSuccess(`Role updated to ${role}`);
      loadUsers(meta.page);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (currentUser && currentUser.role !== 'admin') {
    return <div className="text-center py-20 text-gray-600">Admin access only</div>;
  }

  return (
    <div>
      <Link href="/admin" className="text-primary-600 hover:underline text-sm mb-4 inline-block">
        ← Back to admin
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Users</h1>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border text-gray-500">No users yet</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Semester</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {u.name}
                      {u.id === currentUser?.id && <span className="ml-2 text-xs text-primary-600">(you)</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{u.department || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{u.semester || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700'
                        : u.role === 'organizer' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                Showing {users.length} of {meta.total} users
              </p>
              <div className="flex gap-2">
                <button
                  disabled={meta.page === 1}
                  onClick={() => loadUsers(meta.page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-700">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => loadUsers(meta.page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
