// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfTE0aLnioPSvKEMq96m5vxO9iqaxBYk",
  authDomain: "smart-hospital-51bf4.firebaseapp.com",
  databaseURL: "https://smart-hospital-51bf4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-hospital-51bf4",
  storageBucket: "smart-hospital-51bf4.appspot.com",
  messagingSenderId: "614166639876",
  appId: "1:614166639876:web:e45d373639ba6edaa38c51"
};

// Initialize Firebase App & Database
export const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);
