fetch('http://localhost:1323/settings/2fa/trust-linked-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trust: true })
}).then(r => r.text()).then(console.log);
