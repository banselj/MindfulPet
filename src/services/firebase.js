import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTXXhJjazo7eHhWXnl0JqtND6C4ngAfGY",
  authDomain: "mindfulpet.firebaseapp.com",
  projectId: "mindfulpet",
  storageBucket: "mindfulpet.appspot.com",
  messagingSenderId: "70393826245",
  appId: "1:70393826245:web:9dc5dd2a6250836daf99ac",
  measurementId: "G-KSDPXP7WXR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
