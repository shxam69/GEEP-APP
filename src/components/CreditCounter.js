import React from "react";

const CreditCounter = ({ credits }) => (
  <div style={{ fontSize: "1.5rem", color: "#4CAF50", fontWeight: "bold", marginBottom: "10px" }}>
    Credits: {credits}
  </div>
);

export default CreditCounter;
import { logMessage } from "./utils/log";

logMessage("User logged in");
