// ── Firebase (apenas como "porteiro" do login Google) ────────────────────────
// A config web do Firebase é PÚBLICA (vai pro navegador de qualquer forma),
// então pode ficar no código. A identidade real fica no NOSSO backend/JWT.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDOvIa2lPNk76-Z7KrAm-HuJvfvmVPizHU',
  authDomain: 'curriculou-7439c.firebaseapp.com',
  projectId: 'curriculou-7439c',
  storageBucket: 'curriculou-7439c.firebasestorage.app',
  messagingSenderId: '259508422407',
  appId: '1:259508422407:web:b5e537b4afd94cfd7c67a2',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/** Abre o popup do Google e devolve o ID token do Firebase (pra mandar ao backend). */
export async function loginGooglePopup(): Promise<string> {
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
