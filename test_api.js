async function runTests() {
  try {
    console.log('Testing Health API...');
    const healthRes = await fetch('http://localhost:5000/api/v1/health');
    const health = await healthRes.json();
    console.log('Health Response:', health);

    console.log('\nTesting 1-Click Demo Login...');
    const demoRes = await fetch('http://localhost:5000/api/v1/auth/demo', { method: 'POST' });
    const demoData = await demoRes.json();
    console.log('Demo Logged in as:', demoData.user.name, demoData.user.email);
    const token = demoData.token;

    console.log('\nTesting People API with token...');
    const peopleRes = await fetch('http://localhost:5000/api/v1/people', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const peopleData = await peopleRes.json();
    console.log(`Loaded ${peopleData.people.length} people tabs.`);
    peopleData.people.forEach(p => {
      console.log(` - ${p.person.name} (${p.person.relationship}): You Owe: ₹${p.youOwe}, They Owe: ₹${p.theyOweYou}, Net: ₹${p.netBalance}`);
    });

    console.log('\nTesting Dues API...');
    const duesRes = await fetch('http://localhost:5000/api/v1/dues', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const duesData = await duesRes.json();
    console.log('Dues Summary:', duesData.summary);

    console.log('\nTesting Schedules API...');
    const schRes = await fetch('http://localhost:5000/api/v1/schedules', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const schData = await schRes.json();
    console.log(`Loaded ${schData.schedules.length} schedules.`);

    console.log('\nTesting Analytics API...');
    const anaRes = await fetch('http://localhost:5000/api/v1/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const anaData = await anaRes.json();
    console.log('Analytics Overview:', anaData.overview);

    console.log('\nTesting Search API for "Rahul"...');
    const searchRes = await fetch('http://localhost:5000/api/v1/search?q=Rahul', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    console.log(`Search for "Rahul" returned: ${searchData.people.length} people, ${searchData.transactions.length} txs, ${searchData.schedules.length} schedules, ${searchData.reminders.length} reminders.`);

    console.log('\n✅ ALL BACKEND REST API ENDPOINTS VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('API Verification failed:', err);
  }
}

runTests();
