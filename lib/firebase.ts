import { getApp, getApps, initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUMpst90deY8gnoeOEHi73ohAp__ls1mk",
  authDomain: "studymate-34cf3.firebaseapp.com",
  projectId: "studymate-34cf3",
  storageBucket: "studymate-34cf3.firebasestorage.app",
  messagingSenderId: "366183915021",
  appId: "1:366183915021:web:2842bc55c721ce3ffdff44",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,

  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
