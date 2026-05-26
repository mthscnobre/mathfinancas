import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

export const signIn = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export const signOut = async () => {
  await firebaseSignOut(auth)
}

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}