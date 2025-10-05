import React, { useState } from "react";
import { updateDoc, serverTimestamp } from "firebase/firestore";

function AIQuiz({ challenge, onComplete }) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    // Here you can integrate OpenAI API to validate/generate hints
    alert(`AI Quiz "${challenge.title}" submitted!`);
    await onComplete(challenge);
    setSubmitted(true);
  };

  return (
    <div style={{ border: "1px solid purple", margin: "10px", padding: "10px" }}>
      <h3>{challenge.title} (AI Quiz, {challenge.points} pts)</h3>
      <p>{challenge.description}</p>
      <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Your answer" disabled={submitted} />
      <button onClick={handleSubmit} disabled={submitted}>Submit</button>
    </div>
  );
}

export default AIQuiz;
