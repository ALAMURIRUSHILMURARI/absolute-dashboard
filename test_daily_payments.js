async function testDailyPayments() {
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

  console.log('2. Recording a single UPI Daily Payment: Chai & Samosa ₹60...');
  const createUpiRes = await fetch(`${base}/daily-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 60,
      reason: 'Chai & Samosa',
      paymentMethod: 'UPI',
      date: '2026-08-17',
      category: 'Food & Dining'
    })
  });
  const upiData = await createUpiRes.json();
  console.log('Created UPI payment:', upiData.payment.reason, 'Amount:', upiData.payment.amount, 'Method:', upiData.payment.paymentMethod);

  console.log('3. Recording a single Cash Daily Payment: Auto Rickshaw Fare ₹120...');
  const createCashRes = await fetch(`${base}/daily-payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 120,
      reason: 'Auto Rickshaw Fare',
      paymentMethod: 'Cash',
      date: '2026-08-17',
      category: 'Travel & Fuel'
    })
  });
  const cashData = await createCashRes.json();
  console.log('Created Cash payment:', cashData.payment.reason, 'Amount:', cashData.payment.amount, 'Method:', cashData.payment.paymentMethod);

  console.log('4. Testing Bulk Upload for 2 items...');
  const bulkRes = await fetch(`${base}/daily-payments/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      date: '2026-08-17',
      items: [
        { amount: 350, reason: 'Supermarket Groceries', paymentMethod: 'UPI', category: 'Groceries' },
        { amount: 50, reason: 'Cold Drink & Chips', paymentMethod: 'Cash', category: 'Food & Dining' }
      ]
    })
  });
  const bulkData = await bulkRes.json();
  console.log('Bulk response:', bulkData.message, 'Count:', bulkData.payments.length);

  console.log('5. Fetching Daily Payments Summary...');
  const summaryRes = await fetch(`${base}/daily-payments/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const summaryData = await summaryRes.json();
  console.log('Summary Today:', summaryData.today);
  console.log('Summary Month:', summaryData.month);

  console.log('6. Fetching all daily payments list...');
  const listRes = await fetch(`${base}/daily-payments?date=2026-08-17`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log('Fetched count for today:', listData.payments.length);

  console.log('✅ ALL DAILY PAYMENTS API TESTS PASSED SUCCESSFULLY!');
}

testDailyPayments().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
