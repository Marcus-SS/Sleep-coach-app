const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function syncWhoop() {
  try {
    const res = await fetch('http://localhost:3000/api/sync/whoop');
    const data = await res.json();
    console.log(`[${new Date().toLocaleTimeString()}] Synced Whoop data:`, data);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Sync failed:`, err.message);
  }
}

console.log('Starting mock Whoop data sync every minute...');
syncWhoop();
setInterval(syncWhoop, 60 * 1000);
