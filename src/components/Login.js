// src/components/Login.js
import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Registered and logged in ✅");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in ✅");
      }
    } catch (err) {
      alert("Auth error: " + err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #667eea, #764ba2)", fontFamily: "Arial, sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff", padding: 28, borderRadius: 12, width: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ marginTop: 0, color: "#333" }}>{isRegister ? "Register" : "Login"}</h2>
        <input required type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #ddd" }} />
        <input required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #ddd" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{
            flex: 1, padding: 10, borderRadius: 8, background: "#764ba2", color: "#fff", border: "none", cursor: "pointer"
          }}>{isRegister ? "Register" : "Login"}</button>
          <button type="button" onClick={() => setIsRegister(!isRegister)} style={{
            padding: 10, borderRadius: 8, border: "1px solid #764ba2", background: "transparent", color: "#764ba2", cursor: "pointer"
          }}>{isRegister ? "Have account?" : "New user?"}</button>
        </div>
        <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>Use any test email/password (will be created if registering).</p>
      </form>
    </div>
  );
}
