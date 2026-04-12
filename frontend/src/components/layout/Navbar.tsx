'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-primary-600">
            CampusPulse
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/events" className="text-gray-600 hover:text-gray-900 transition">
              Events
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition">
                    Admin Panel
                  </Link>
                )}
                <Link href="/registrations" className="text-gray-600 hover:text-gray-900 transition">
                  My Registrations
                </Link>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900 transition">
                  Profile
                </Link>
                <div className="flex items-center gap-3 pl-3 border-l">
                  <span className="text-sm text-gray-500">
                    {user.name}
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 capitalize">
                      {user.role}
                    </span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="sm:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            <Link href="/events" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
              Events
            </Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <Link href="/registrations" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
                  My Registrations
                </Link>
                <Link href="/profile" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <div className="pt-2 border-t">
                  <span className="text-sm text-gray-500">{user.name} ({user.role})</span>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="block mt-2 text-sm text-red-600">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="block py-2 text-primary-600 font-medium" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
