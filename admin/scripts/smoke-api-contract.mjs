const baseUrl = (process.env.ADMIN_API_BASE_URL || 'https://api.asemos.tr/api/v1').replace(/\/+$/, '');
const maxAttempts = 3;

const checks = [
  {
    name: 'login',
    path: '/auth/login',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
  },
  {
    name: 'stats',
    path: '/admin/stats',
    init: { method: 'GET' },
  },
  {
    name: 'user role mutation',
    path: '/admin/users/0/role',
    init: {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'standard' }),
    },
  },
];

let failed = false;

for (const check of checks) {
  let response;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetch(`${baseUrl}${check.path}`, {
        ...check.init,
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  if (!response) {
    failed = true;
    console.error(`FAIL ${check.name}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    continue;
  }

  const routed = response.status !== 404;
  console.log(`${routed ? 'PASS' : 'FAIL'} ${check.name}: HTTP ${response.status}`);
  failed ||= !routed;
}

if (failed) {
  process.exitCode = 1;
}
