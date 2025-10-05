// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { signOut } from "firebase/auth";

/*
All-in-one dashboard:
- credits & streak (daily bonus)
- demo challenges: task(upload), challenge(quiz), learning(iot), mini-game
- costs to attempt (taskCost, quizCost, gameCost)
- file upload saved to Firebase Storage (simple AI approval simulation)
- mini-game spends credits before play, awards earned points after play
*/

// Floating +points animation
const floatPoints = (points) => {
  const el = document.createElement("div");
  el.innerText = `+${points} ⭐`;
  el.style.position = "fixed";
  el.style.top = "50%";
  el.style.left = "50%";
  el.style.transform = "translate(-50%, -50%)";
  el.style.fontSize = "28px";
  el.style.color = "#ffcc00";
  el.style.fontWeight = "700";
  el.style.zIndex = 2000;
  el.style.animation = "floatUp 900ms ease-out forwards";
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 900);

  if (!document.getElementById("float-points-style")) {
    const style = document.createElement("style");
    style.id = "float-points-style";
    style.innerHTML = `
      @keyframes floatUp {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -140%) scale(1.1); }
      }
    `;
    document.head.appendChild(style);
  }
};

// small confetti
const triggerConfetti = () => {
  for (let i = 0; i < 25; i++) {
    const c = document.createElement("div");
    c.innerText = "🎉";
    c.style.position = "fixed";
    c.style.top = Math.random() * window.innerHeight + "px";
    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.fontSize = Math.random() * 20 + 16 + "px";
    c.style.zIndex = 1500;
    c.style.opacity = Math.random();
    document.body.appendChild(c);
    setTimeout(() => document.body.removeChild(c), 1200);
  }
};

// Modal component
const Modal = ({ children, onClose }) => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200
  }}>
    <div style={{
      background: "#1e1e2f", color: "#fff", borderRadius: 14, padding: 20, width: "94%", maxWidth: 520, boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
    }}>
      {children}
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 10, background: "#ff5e5e", color: "#fff", border: "none", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  </div>
);

// Card component
const Card = ({ title, desc, points, onClick, color }) => (
  <div onClick={onClick} style={{
    flex: "1 1 250px", margin: 10, padding: 18, borderRadius: 14,
    background: color, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    transition: "transform .18s"
  }}
    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} >
    <h3 style={{ margin: "0 0 8px 0" }}>{title}</h3>
    <p style={{ margin: "0 0 8px 0", color: "#222" }}>{desc}</p>
    <p style={{ margin: 0, fontWeight: 700 }}>Points: {points} ⭐</p>
  </div>
);

export default function Dashboard() {
  const [userData, setUserData] = useState({ credits: 0, streak: 0, completedChallenges: [], bonusGiven: false, lastLogin: null });
  const [challenges, setChallenges] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [miniGameUnlocked, setMiniGameUnlocked] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const userRef = doc(db, "users", auth.currentUser.uid);

  // costs to attempt
  const taskCost = 5;
  const quizCost = 7;
  const learningCost = 3;
  const gameCost = 10;

  // demo list (messages embedded)
  const demo = [
    { id: "t1", title: "Task", description: "Upload proof to complete a simple task", points: 10, type: "task", message: "⏳ Waitt we are thinking what task will be perfect for u" },
    { id: "a1", title: "Challenges", description: "Answer a short quiz", points: 15, type: "challenge", question: "Which of these is AI?", options: ["Artificial Intelligence", "Apple Inc", "Airplane"], answer: 0, message: "🤯 Uff there is no tough challenge for u we are thinking which suits u" },
    { id: "i1", title: "Learning", description: "IoT demo (learning)", points: 20, type: "learning", message: "🧠 We know that u know everything which means u are clever" },
    { id: "g1", title: "Mini Game", description: "Click fast to earn points", points: 25, type: "game", message: "🎮 Nooo, the developer is cooking the gamee… justtt stayyy patient" }
  ];

  // fetch user and handle streak + daily bonus
  const fetchUser = async () => {
    try {
      const snap = await getDoc(userRef);
      const today = new Date();
      const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // midnight
      if (snap.exists()) {
        const data = snap.data();
        let credits = data.credits ?? 0;
        let streak = data.streak ?? 0;
        const lastLogin = data.lastLogin ? data.lastLogin.toDate() : null;

        // streak logic: consider day difference between lastLogin and today
        let daysDiff = lastLogin ? Math.floor((todayMid - new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())) / (1000 * 60 * 60 * 24)) : null;
        let updates = {};
        if (daysDiff === 0) {
          // already logged in today — nothing
        } else if (daysDiff === 1) {
          // consecutive day -> increment streak & award bonus
          streak = (streak || 0) + 1;
          credits = credits + 5; // daily streak bonus
          updates.streak = streak;
          updates.credits = credits;
          updates.lastLogin = serverTimestamp();
          await setDoc(userRef, updates, { merge: true });
          setUserData({ ...data, credits, streak, lastLogin: new Date() });
          floatAndConfetti(5);
        } else {
          // gap or never -> reset streak to 1 and give daily bonus
          streak = 1;
          credits = credits + 5;
          updates.streak = streak;
          updates.credits = credits;
          updates.lastLogin = serverTimestamp();
          await setDoc(userRef, updates, { merge: true });
          setUserData({ ...data, credits, streak, lastLogin: new Date() });
          floatAndConfetti(5);
        }
        // if lastLogin was null (first ever login), we already gave credits when doc created initially below
        if (daysDiff === 0) {
          // just set userData as-is
          setUserData({ ...data, lastLogin: lastLogin });
        }
      } else {
        // create initial user doc with bonus 30 credits and streak 1
        const initial = { credits: 30, streak: 1, completedChallenges: [], bonusGiven: true, lastLogin: serverTimestamp() };
        await setDoc(userRef, initial);
        setUserData({ credits: 30, streak: 1, completedChallenges: [], bonusGiven: true, lastLogin: new Date() });
        floatAndConfetti(30);
      }
    } catch (err) {
      console.error("fetchUser error:", err);
    }
  };

  // helper: show floating points and confetti
  const floatAndConfetti = (pts) => {
    floatPoints(pts);
    triggerConfetti();
  };

  useEffect(() => {
    setChallenges(demo);
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // helper to update user doc safely (set merge)
  const saveUser = async (fields) => {
    try {
      await setDoc(userRef, fields, { merge: true });
    } catch (err) {
      console.error("saveUser error:", err);
    }
  };

  // Attempt cost check & deduct
  const attemptCost = async (cost) => {
    const credits = userData.credits || 0;
    if (credits < cost) {
      alert("❌ Not enough credits to attempt. Earn more from other challenges.");
      return false;
    }
    const newCredits = credits - cost;
    await saveUser({ credits: newCredits });
    setUserData(prev => ({ ...prev, credits: newCredits }));
    return true;
  };

  // complete challenge awarding points
  const awardPoints = async (challenge) => {
    if ((userData.completedChallenges || []).includes(challenge.id)) {
      alert("Already completed.");
      return;
    }
    const newCredits = (userData.credits || 0) + challenge.points;
    const newCompleted = [...(userData.completedChallenges || []), challenge.id];
    await saveUser({ credits: newCredits, completedChallenges: newCompleted, lastActive: serverTimestamp() });
    setUserData(prev => ({ ...prev, credits: newCredits, completedChallenges: newCompleted }));
    floatAndConfetti(challenge.points);
    if (challenge.type === "game") setMiniGameUnlocked(true);
  };

  // TASK: upload file then award points (simulate AI verify)
  const handleTaskSubmit = async (challenge) => {
    if (!await attemptCost(taskCost)) return; // charge to attempt
    if (!selectedFile) { alert("Select a file first."); return; }
    try {
      setLoading(true);
      const sRef = storageRef(storage, `uploads/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(sRef, selectedFile);
      // Simulate AI approval delay
      setTimeout(async () => {
        await awardPoints(challenge);
        setSelectedFile(null);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setLoading(false);
      console.error("upload error", err);
      alert("Upload failed: " + err.message);
    }
  };

  // QUIZ: charge to attempt then validate answer and award if correct
  const handleQuizAttempt = async (challenge) => {
    if (!await attemptCost(quizCost)) return;
    if (quizAnswer === null) { alert("Select an answer"); return; }
    if (quizAnswer === challenge.answer) {
      await awardPoints(challenge);
    } else {
      alert("❌ Wrong answer. Better luck next time.");
    }
    setQuizAnswer(null);
  };

  // LEARNING / IoT demo: charge then mark complete
  const handleLearning = async (challenge) => {
    if (!await attemptCost(learningCost)) return;
    await awardPoints(challenge);
  };

  // MINI-GAME: charge cost to start, then play and award earned points
  const handlePlayGame = async (challenge) => {
    // check unlock and cost
    if (!await attemptCost(gameCost)) return; // deduct to attempt
    // play demo
    alert(`You paid ${gameCost} credits to play. Click fast for 5 seconds to earn extra points!`);
    let clicks = 0;
    const handler = () => clicks++;
    window.addEventListener("click", handler);
    setTimeout(async () => {
      window.removeEventListener("click", handler);
      const earned = clicks * 2;
      // update credits: add earned to user
      const afterCredits = (userData.credits || 0) + earned; // userData already had cost deducted earlier
      await saveUser({ credits: afterCredits, lastActive: serverTimestamp() });
      setUserData(prev => ({ ...prev, credits: afterCredits }));
      floatAndConfetti(earned);
      alert(`Time up! You clicked ${clicks} times and earned ${earned} points.`);
      // optionally mark the mini-game challenge complete (award its base points too if not done)
      if (!userData.completedChallenges.includes(challenge.id)) {
        await awardPoints(challenge); // awards challenge.points in addition
      }
    }, 5000);
  };

  const setLoading = (v) => setLoadingAction(v);

  // Logout
  const doLogout = async () => {
    await signOut(auth);
    // refresh to ensure login screen shows (onAuthStateChanged will handle)
    window.location.reload();
  };

  // render
  return (
    <div style={{ minHeight: "100vh", padding: 20, fontFamily: "Arial, sans-serif", background: "linear-gradient(120deg,#1e1e2f,#2c2c4a)", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0, color: "#ffcc00" }}>🎮 Gamified Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>Credits: <strong>{userData.credits}</strong> ⭐</div>
          <div>Streak: <strong>{userData.streak}</strong> 🔥</div>
          <button onClick={doLogout} style={{ padding: "6px 12px", borderRadius: 8, background: "#ff5e5e", border: "none", color: "#fff", cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* progress bar & streak bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 8 }}>XP Progress</div>
        <div style={{ height: 16, background: "#333", borderRadius: 12 }}>
          <div style={{ width: `${(userData.credits % 100)}%`, height: "100%", borderRadius: 12, background: "linear-gradient(90deg,#ffcc00,#ff8800)" }} />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 8 }}>Streak progress</div>
        <div style={{ height: 12, background: "#333", borderRadius: 12 }}>
          <div style={{ width: `${Math.min((userData.streak || 0) * 10, 100)}%`, height: "100%", borderRadius: 12, background: "linear-gradient(90deg,#ff3300,#ffaa00)" }} />
        </div>
      </div>

      <h2>Challenges</h2>

      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 18 }}>
        {challenges.map(ch => {
          const color = ch.type === "task" ? "linear-gradient(135deg,#fff2c7,#ffe8b0)"
            : ch.type === "challenge" ? "linear-gradient(135deg,#ffb7ff,#ff9de2)"
            : ch.type === "learning" ? "linear-gradient(135deg,#b7ffd9,#a3ffd9)"
            : "linear-gradient(135deg,#ffd27f,#ffde8f)";
          return <Card key={ch.id} title={ch.title} desc={ch.description} points={ch.points} color={color} onClick={() => setActiveId(ch.id)} />;
        })}
      </div>

      {activeId && (
        <Modal onClose={() => { setActiveId(null); setQuizAnswer(null); setSelectedFile(null); }}>
          {challenges.filter(c => c.id === activeId).map(ch => (
            <div key={ch.id}>
              <h2 style={{ marginTop: 0 }}>{ch.title}</h2>
              <p style={{ fontWeight: 700, color: "#ffdd55" }}>{ch.message}</p>

              {/* Task */}
              {ch.type === "task" && (
                <>
                  <p>Cost to attempt: {taskCost} credits</p>
                  <input type="file" onChange={e => setSelectedFile(e.target.files[0])} />
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => handleTaskSubmit(ch)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" }} disabled={loadingAction}>
                      {loadingAction ? "Uploading..." : `Submit & Attempt (${taskCost} credits)` }
                    </button>
                  </div>
                </>
              )}

              {/* Challenge (quiz) */}
              {ch.type === "challenge" && (
                <>
                  <p>Cost to attempt: {quizCost} credits</p>
                  <p style={{ marginTop: 8 }}>{ch.question}</p>
                  {ch.options && ch.options.map((opt, i) => (
                    <button key={i} onClick={() => setQuizAnswer(i)} style={{
                      display: "block", width: "100%", margin: "6px 0", padding: 10, borderRadius: 8,
                      background: quizAnswer === i ? "#ffd27f" : "#fff", color: "#111", border: "none", cursor: "pointer"
                    }}>{opt}</button>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => handleQuizAttempt(ch)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" }}>
                      Attempt & Submit ({quizCost} credits)
                    </button>
                  </div>
                </>
              )}

              {/* Learning / IoT */}
              {ch.type === "learning" && (
                <>
                  <p>Cost to attempt: {learningCost} credits</p>
                  <p>Demo learning / IoT action</p>
                  <button onClick={() => handleLearning(ch)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#4caf50", color: "#fff", cursor: "pointer" }}>
                    Attempt Learning ({learningCost} credits)
                  </button>
                </>
              )}

              {/* Mini-game */}
              {ch.type === "game" && (
                <>
                  <p>Cost to play: {gameCost} credits</p>
                  {!miniGameUnlocked && <p style={{ color: "#ffdd55" }}>{ch.message}</p>}
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => handlePlayGame(ch)} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#ffcc00", color: "#111", cursor: "pointer" }}>
                      Play Mini-Game ({gameCost} credits)
                    </button>
                  </div>
                </>
              )}

            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
