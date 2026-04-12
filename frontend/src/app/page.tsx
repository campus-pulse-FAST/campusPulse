'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        CampusPulse
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        A centralized Management Information System for campus event scheduling,
        student registration, and feedback management.
      </p>

      {user ? (
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            Welcome back, <span className="font-semibold">{user.name}</span>!
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/events"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Browse Events
            </Link>
            <Link
              href="/profile"
              className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              My Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <Link
            href="/events"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Browse Events
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
