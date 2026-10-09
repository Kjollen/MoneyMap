import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDW_QlYGeeDST5m-zIzHrQJ__6Qlv81NWg",
  authDomain: "moneymap-7b269.firebaseapp.com",
  projectId: "moneymap-7b269",
  storageBucket: "moneymap-7b269.firebasestorage.app",
  messagingSenderId: "1036609406214",
  appId: "1:1036609406214:web:2a35be45a485defb2d8a87"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
