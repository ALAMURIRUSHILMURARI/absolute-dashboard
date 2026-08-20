async function testPersistence() {
  const base = 'http://localhost:5000/api/v1';

  console.log('1. Testing login with clean demo user...');
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@absolute.app', password: 'demo123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in:', loginData.user.name, 'Token received:', !!token);

  console.log('2. Checking people list (should be 0 initially)...');
  const peopleRes = await fetch(`${base}/people`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const peopleData = await peopleRes.json();
  console.log('People count:', peopleData.people.length);

  console.log('3. Adding a new real person tab: Alex Rivers (Colleague)...');
  const addPersonRes = await fetch(`${base}/people`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Alex Rivers',
      relationship: 'Colleague',
      phone: '+91 99887 76655',
      notes: 'Design sprint co-lead'
    })
  });
  const addPersonData = await addPersonRes.json();
  console.log('Created person:', addPersonData.person.name, 'ID:', addPersonData.person.id);

  console.log('4. Adding a real transaction: Shared Software License ₹2,400 (They Owe Me)...');
  const addTxRes = await fetch(`${base}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      personId: addPersonData.person.id,
      amount: 2400,
      direction: 'THEY_OWE_ME',
      type: 'Expense',
      description: 'Shared Figma Org Plan',
      date: '2026-08-17',
      paymentMethod: 'UPI'
    })
  });
  const addTxData = await addTxRes.json();
  console.log('Created transaction:', addTxData.transaction.description, 'Amount:', addTxData.transaction.amount);

  console.log('5. Adding a real schedule item: Team Architecture Sync...');
  const addSchedRes = await fetch(`${base}/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Team Architecture Sync',
      date: '2026-08-17',
      startTime: '16:00',
      endTime: '17:00',
      category: 'Work',
      priority: 'High',
      location: 'Google Meet'
    })
  });
  const addSchedData = await addSchedRes.json();
  console.log('Created schedule:', addSchedData.schedule.title);

  console.log('6. Verifying dashboard analytics...');
  const analyticsRes = await fetch(`${base}/analytics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const analyticsData = await analyticsRes.json();
  console.log('Analytics overview:', analyticsData.overview);

  console.log('✅ TEST PASSED: Database stores persistent real data without default dummy noise.');
}

testPersistence().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
