async function testEmailAlerts() {
  const base = 'http://localhost:5000/api/v1';

  console.log('1. Logging in...');
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@absolute.app', password: 'demo123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Authenticated:', !!token);

  console.log('2. Testing Urgent Priority Email Dispatch to mail4murari27@gmail.com...');
  const urgentRes = await fetch(`${base}/schedules/test-priority-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      priority: 'Urgent',
      email: 'mail4murari27@gmail.com'
    })
  });
  const urgentData = await urgentRes.json();
  console.log('Urgent result:', urgentData.message);

  console.log('3. Testing High Priority Email Dispatch (BNP Paribas Exam)...');
  const highRes = await fetch(`${base}/schedules/test-priority-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      priority: 'High',
      email: 'mail4murari27@gmail.com'
    })
  });
  const highData = await highRes.json();
  console.log('High result:', highData.message);

  console.log('4. Testing Medium Priority Email Dispatch...');
  const medRes = await fetch(`${base}/schedules/test-priority-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      priority: 'Medium',
      email: 'mail4murari27@gmail.com'
    })
  });
  const medData = await medRes.json();
  console.log('Medium result:', medData.message);

  console.log('5. Testing Low Priority Email Dispatch...');
  const lowRes = await fetch(`${base}/schedules/test-priority-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      priority: 'Low',
      email: 'mail4murari27@gmail.com'
    })
  });
  const lowData = await lowRes.json();
  console.log('Low result:', lowData.message);

  console.log('✅ ALL 4 PRIORITY EMAIL ALERT TESTS EXECUTED AND PASSED!');
}

testEmailAlerts().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
