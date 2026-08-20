async function testFrontend() {
  const html = await (await fetch('http://localhost:5173/')).text();
  console.log('HTML Loaded length:', html.length, 'Contains ABSOLUTE:', html.includes('ABSOLUTE'));

  // Test proxied API through Vite
  const proxiedHealth = await (await fetch('http://localhost:5173/api/v1/health')).json();
  console.log('Proxied Health check via Vite (5173 -> 5000):', proxiedHealth);
}

testFrontend();
