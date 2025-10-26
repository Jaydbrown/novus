// provider.js
const BASE_URL = 'http://localhost:4000';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Server error ${res.status}: ${errText}`);
  }

  return res.json();
}
