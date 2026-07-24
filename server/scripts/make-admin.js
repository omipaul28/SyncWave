/**
 * One-time script: promote a user to admin role by email.
 * Usage: node scripts/make-admin.js your@email.com
 *
 * Run from the server/ directory:
 *   node scripts/make-admin.js your@email.com
 */

require('dotenv').config();
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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
const auth = getAuth();

async function makeAdmin(email) {
  if (!email) {
    console.error('❌  Usage: node scripts/make-admin.js your@email.com');
    process.exit(1);
  }

  try {
    // Look up the Firebase Auth user by email
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Update (or create) the Firestore users document
    await db.collection('users').doc(uid).set(
      { role: 'admin' },
      { merge: true }
    );

    console.log(`✅  Success! User "${email}" (uid: ${uid}) is now an admin.`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌  No Firebase Auth user found for "${email}".`);
      console.error('    Make sure you have registered in the app first.');
    } else {
      console.error('❌  Error:', err.message);
    }
    process.exit(1);
  }
}

makeAdmin(process.argv[2]);
