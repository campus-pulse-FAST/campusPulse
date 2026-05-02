#!/usr/bin/env bun
/**
 * Seeds demo data via the API gateway.
 * Run after docker compose up — populates categories, venues, events, students, registrations.
 *
 * Usage: bun run scripts/seed-demo-data.ts
 */

const API = process.env.API_URL || 'http://localhost:3000/api';

async function api(path: string, options: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = options;
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
    ...rest,
  });
  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(`${path}: ${data.error?.message || data.message || res.status}`);
  }
  return data.data || data;
}

async function main() {
  console.log('🌱 Seeding CampusPulse demo data...\n');

  // 1. Create admin user
  console.log('1. Creating admin user...');
  let adminToken: string;
  try {
    const adminReg = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@campuspulse.edu',
        password: 'admin12345',
        name: 'Campus Admin',
        department: 'Administration',
      }),
    });
    adminToken = adminReg.accessToken;
  } catch {
    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@campuspulse.edu', password: 'admin12345' }),
    });
    adminToken = login.accessToken;
  }
  console.log('   ✓ admin@campuspulse.edu / admin12345');

  // Need to elevate admin role directly in DB — print a SQL hint
  console.log('   ! Run this SQL to make admin (only first time):');
  console.log("     PGPASSWORD=campus123 psql -h localhost -p 5433 -U campus -d campuspulse -c \"UPDATE users.users SET role='admin' WHERE email='admin@campuspulse.edu';\"\n");
  console.log('   Re-login to get admin token...');
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@campuspulse.edu', password: 'admin12345' }),
  });
  adminToken = adminLogin.accessToken;
  if (adminLogin.user.role !== 'admin') {
    console.error('   ✗ User is not admin yet. Run the SQL above and re-run the seed script.');
    process.exit(1);
  }

  // 2. Seed categories
  console.log('2. Seeding categories...');
  const categoriesRes = await api('/categories/seed', { method: 'POST', token: adminToken });
  const categories = categoriesRes.categories;
  console.log(`   ✓ ${categories.length} categories ready`);

  // 3. Create venues
  console.log('3. Creating venues...');
  const venueDefs = [
    { name: 'Main Auditorium', location: 'Building A, Ground Floor', capacity: 300, amenities: ['projector', 'sound system', 'AC'] },
    { name: 'Conference Hall', location: 'Building B, 2nd Floor', capacity: 100, amenities: ['projector', 'whiteboard'] },
    { name: 'Sports Ground', location: 'Outdoor', capacity: 500, amenities: ['lighting'] },
    { name: 'Lecture Theater 1', location: 'Building C, 1st Floor', capacity: 80, amenities: ['projector'] },
  ];
  const venues = [];
  for (const v of venueDefs) {
    try {
      const created = await api('/venues', { method: 'POST', token: adminToken, body: JSON.stringify(v) });
      venues.push(created);
    } catch {
      // Already exists — fetch
      const all = await api('/venues', { token: adminToken });
      venues.push(...all);
      break;
    }
  }
  console.log(`   ✓ ${venues.length} venues ready`);

  // 4. Create student users
  console.log('4. Creating 5 student users...');
  const studentTokens: string[] = [];
  for (let i = 1; i <= 5; i++) {
    try {
      const reg = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `student${i}@campuspulse.edu`,
          password: 'student12345',
          name: `Student ${i}`,
          department: ['Computer Science', 'Electrical Engineering', 'Business', 'Civil', 'Humanities'][i - 1],
          semester: `${i}th`,
        }),
      });
      studentTokens.push(reg.accessToken);
    } catch {
      const login = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: `student${i}@campuspulse.edu`, password: 'student12345' }),
      });
      studentTokens.push(login.accessToken);
    }
  }
  console.log(`   ✓ ${studentTokens.length} students ready`);

  // 5. Create events
  console.log('5. Creating events...');
  const academic = categories.find((c: any) => c.name === 'Academic');
  const social = categories.find((c: any) => c.name === 'Social');
  const sports = categories.find((c: any) => c.name === 'Sports');
  const workshop = categories.find((c: any) => c.name === 'Workshop');
  const cultural = categories.find((c: any) => c.name === 'Cultural');

  const now = new Date();
  const future = (days: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const futureEnd = (days: number, startHour = 10, durationHours = 2) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(startHour + durationHours, 0, 0, 0);
    return d.toISOString();
  };

  const eventDefs = [
    {
      title: 'AI & Machine Learning Workshop',
      description: 'Hands-on intro to neural networks with PyTorch',
      categoryId: workshop?.id,
      venueId: venues[1]?.id,
      startTime: future(3, 10),
      endTime: futureEnd(3, 10, 3),
      capacity: 3,
      status: 'published',
      isPublic: true,
    },
    {
      title: 'Annual Cultural Night',
      description: 'Music, dance, and food from around the world',
      categoryId: cultural?.id,
      venueId: venues[0]?.id,
      startTime: future(7, 18),
      endTime: futureEnd(7, 18, 4),
      capacity: 250,
      status: 'published',
      isPublic: true,
    },
    {
      title: 'Database Design Lecture',
      description: 'Normalization, indexing, and query optimization',
      categoryId: academic?.id,
      venueId: venues[3]?.id,
      startTime: future(2, 14),
      endTime: futureEnd(2, 14, 1),
      capacity: 60,
      status: 'published',
      isPublic: true,
    },
    {
      title: 'Inter-Department Cricket Tournament',
      description: 'Bring your team and compete for the trophy',
      categoryId: sports?.id,
      venueId: venues[2]?.id,
      startTime: future(10, 9),
      endTime: futureEnd(10, 9, 8),
      capacity: 200,
      status: 'published',
      isPublic: true,
    },
    {
      title: 'Welcome Mixer',
      description: 'Meet and greet for new students',
      categoryId: social?.id,
      venueId: venues[1]?.id,
      startTime: future(5, 16),
      endTime: futureEnd(5, 16, 2),
      capacity: 80,
      status: 'published',
      isPublic: true,
    },
    {
      title: 'Career Fair 2026',
      description: 'Top tech and consulting firms recruiting',
      categoryId: academic?.id,
      venueId: venues[0]?.id,
      startTime: future(14, 10),
      endTime: futureEnd(14, 10, 6),
      capacity: 280,
      status: 'published',
      isPublic: true,
    },
  ];

  const events = [];
  for (const e of eventDefs) {
    try {
      const created = await api('/events', { method: 'POST', token: adminToken, body: JSON.stringify(e) });
      events.push(created);
    } catch (err: any) {
      console.warn(`   ⚠ Skipped event "${e.title}": ${err.message}`);
    }
  }
  console.log(`   ✓ ${events.length} events created`);

  // 6. Create registrations to demo waitlist
  console.log('6. Creating registrations (demoing waitlist)...');
  const aiWorkshop = events.find((e: any) => e.title.includes('AI'));
  if (aiWorkshop) {
    // Capacity 3 — register 5 students to trigger waitlist
    let registered = 0;
    let waitlisted = 0;
    for (const studentToken of studentTokens) {
      try {
        const reg = await api('/registrations', {
          method: 'POST',
          token: studentToken,
          body: JSON.stringify({ eventId: aiWorkshop.id }),
        });
        if (reg.status === 'confirmed') registered++;
        else waitlisted++;
      } catch {}
    }
    console.log(`   ✓ AI Workshop: ${registered} confirmed, ${waitlisted} waitlisted`);
  }

  // Some students register for other events
  for (const event of events.slice(1, 4)) {
    for (const studentToken of studentTokens.slice(0, 3)) {
      try {
        await api('/registrations', {
          method: 'POST',
          token: studentToken,
          body: JSON.stringify({ eventId: event.id }),
        });
      } catch {}
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Admin:    admin@campuspulse.edu / admin12345');
  console.log('  Students: student1..5@campuspulse.edu / student12345');
  console.log('\nOpen http://localhost:4000 to demo.');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
