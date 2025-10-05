// src/App.js
import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);
  return user ? <Dashboard /> : <Login />;
}
