import React, { useState } from "react";
import Patient from "./components/Patient.jsx";
import Doctor from "./components/Doctor";
import "./App.css";

export default function App() {
  const [role, setRole] = useState("patient"); // "patient" or "doctor"

  return (
    <div className="app">
      <header className="app-header">
        <h1>MedBlock Alert — Aptos Demo</h1>
        <div className="role-toggle">
          <button
            className={role === "patient" ? "active" : ""}
            onClick={() => setRole("patient")}
          >
            Patient
          </button>
          <button
            className={role === "doctor" ? "active" : ""}
            onClick={() => setRole("doctor")}
          >
            Doctor
          </button>
        </div>
      </header>

      <main className="app-main">
        {role === "patient" ? <Patient /> : <Doctor />}
      </main>

      
    </div>
  );
}
