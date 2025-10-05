import React from "react";

function Task({ challenge, onComplete }) {
  return (
    <div style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
      <h3>{challenge.title} ({challenge.points} pts)</h3>
      <p>{challenge.description}</p>
      <button onClick={onComplete}>Complete</button>
    </div>
  );
}

export default Task;
