/**
 * One-time script: clear cached "miss" lyrics documents from Firestore.
 * These are documents where both plain and synced are null — caused by the
 * old bug that cached failed LRCLIB lookups, preventing retries.
 *
 * Usage (from server/ dir):
 *   node scripts/clear-lyrics-cache.js
 */

require('dotenv').config();
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = getFirestore();

async function clearMissedLyrics() {
  const snap = await db.collection('lyrics')
    .where('plain', '==', null)
    .where('source', '==', null)
    .get();

  if (snap.empty) {
    console.log('✅ No stale lyrics cache entries found.');
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`✅ Deleted ${snap.size} stale lyrics cache entries.`);
}

clearMissedLyrics().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
