
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBZkRLiXRHFlz0ki1ZY8WfTbNB-5-wdAUY",
  authDomain: "blush-iceweb.firebaseapp.com",
  projectId: "blush-iceweb",
  storageBucket: "blush-iceweb.firebasestorage.app",
  messagingSenderId: "715055673513",
  appId: "1:715055673513:android:472e453a1b0061fc6139b8",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export default app;

// import { initializeApp, getApps } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyDZ9jN_3-e-AIJfk-F_W347kwQWLw48xVg",
//   authDomain: "blush-9ed46.firebaseapp.com",   // project_id + ".firebaseapp.com"
//   projectId: "blush-9ed46",
//   storageBucket: "blush-9ed46.firebasestorage.app",
//   messagingSenderId: "1025768142938",
//   appId: "1:1025768142938:android:927cd7f8ab67b9a97a8063"
// };

// let app;
// if (!getApps().length) {
//   app = initializeApp(firebaseConfig);
// } else {
//   app = getApps()[0];
// }

// export default app;

