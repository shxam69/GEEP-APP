import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase"; // initialize in firebase.js if needed

function IoTChallenge({ challenge, onComplete }) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const sensorRef = ref(database, `sensors/${challenge.sensorId}`);
    onValue(sensorRef, snapshot => {
      const value = snapshot.val();
      if(value >= challenge.threshold && !triggered) {
        alert(`IoT Challenge "${challenge.title}" triggered!`);
        onComplete(challenge);
        setTriggered(true);
      }
    });
  }, []);

  return (
    <div style={{ border: "1px solid green", margin: "10px", padding: "10px" }}>
      <h3>{challenge.title} (IoT Challenge)</h3>
      <p>{challenge.description}</p>
      {triggered ? <p>Completed ✅</p> : <p>Waiting for IoT trigger...</p>}
    </div>
  );
}

export default IoTChallenge;
