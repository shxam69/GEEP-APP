import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export const updateStreak = async () => {
  if (!auth.currentUser) return;
  const docRef = doc(db, "users", auth.currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const lastDate = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = data.streak || 0;

  if (lastDate) {
    const diff = (today - lastDate) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  } else streak = 1;

  await updateDoc(docRef, {
    streak,
    lastActiveDate: today.toISOString().split("T")[0]
  });

  return streak;
};
