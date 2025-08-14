import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as cryptoUtils from "../utils/crypto";
import { aptosClient } from "../utils/aptosClient";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import "./common.css";


// Move module
const MODULE_ADDRESS = "0xb91a67f12134a80bb35b194eb8ae585f5250bd5805006cefd9c8b2db5eb14970";
const REGISTER_FN = `${MODULE_ADDRESS}::medblock::register_or_update_patient_blob`;

export default function Patient() {
  const { connect, account, connected, signTransaction, signAndSubmitTransaction, disconnect } = useWallet();

  const [addr, setAddr] = useState(null);
  const [form, setForm] = useState({ name: "", bloodGroup: "", allergies: "", conditions: "", phone: "" });
  const [qrPayload, setQrPayload] = useState(null);
  const [localPrivKey, setLocalPrivKey] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      if (connected && account?.address) setAddr(account.address);
    })();
  }, [connected, account]);

  async function handleConnect() {
    try {
      // This triggers Petra popup — only called by button click
      await connect();
      setMessage("Wallet connected: " + (account?.address ?? ""));
      const kp = await cryptoUtils.generateRsaKeyPair();
      setLocalPrivKey(kp.privateKey);
    } catch (e) {
      console.error(e);
      setMessage("Connect failed: " + (e.message || e));
    }
  }

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  // Simulate gas, then submit
  async function submitWithSim(payload) {
    if (!account?.address) throw new Error("Wallet not connected");
    const signed = await signTransaction({ payload });
    const sim = await aptosClient.simulateTransaction(account.address, signed);
    if (!sim?.length) throw new Error("Gas simulation failed");

    const { max_gas_amount, gas_unit_price } = sim[0];
    const finalPayload = {
      ...payload,
      max_gas_amount: (parseInt(max_gas_amount) + 1000).toString(),
      gas_unit_price: gas_unit_price.toString(),
    };
    return await signAndSubmitTransaction({ payload: finalPayload });
  }

  async function handleSaveAndUpload() {
    try {
      if (!form.name || !form.bloodGroup || !form.phone) {
        setMessage("Please fill in all required details before saving.");
        return;
      }

      setMessage("Encrypting...");
      const sym = await cryptoUtils.generateSymKey();
      const symRawBase64 = await cryptoUtils.exportSymKeyRaw(sym);

      const blob = JSON.stringify({ ...form, updatedAt: new Date().toISOString() });
      const encrypted = await cryptoUtils.aesEncrypt(sym, blob);

      setMessage("Submitting to chain...");
      const payload = {
        type: "entry_function_payload",
        function: REGISTER_FN,
        type_arguments: [],
        arguments: [encrypted.ciphertext, encrypted.iv],
      };

      const txRes = await submitWithSim(payload);
      setMessage("Saved on chain (demo): " + JSON.stringify(txRes));

      const qr = { patientAddress: account.address, demo_sym_key: symRawBase64, version: 1 };
      setQrPayload(JSON.stringify(qr));
    } catch (e) {
      console.error(e);
      setMessage("Save failed: " + (e.message || e));
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Patient Dashboard</h2>

        {/* Only connect on button click */}
        {!connected ? (
          <div>
            <button className="primary" onClick={handleConnect}>
              Connect Wallet
            </button>
           
          </div>
        ) : (
          <div>
            <p className="small">Connected: {addr}</p>
            <button
              className="secondary"
              onClick={() => {
                disconnect();
                setAddr(null);
                setMessage("Wallet disconnected");
              }}
            >
              Disconnect
            </button>

            <div className="row">
              <div className="col">
                <label className="small">Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" />
                <label className="small">Blood Group</label>
                <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input" />
                <label className="small">Allergies</label>
                <input name="allergies" value={form.allergies} onChange={handleChange} className="input" />
                <label className="small">Chronic Conditions</label>
                <input name="conditions" value={form.conditions} onChange={handleChange} className="input" />
                <label className="small">Emergency Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input" />
                <div style={{ marginTop: 10 }}>
                  <button className="primary" onClick={handleSaveAndUpload}>
                    Encrypt & Save (Demo)
                  </button>
                </div>
              </div>
              <div className="col">
                <h4>QR Code to share with doctor</h4>
                {qrPayload ? (
                  <div className="qr-container">
                    <QRCodeCanvas value={qrPayload} size={180} />
                    <textarea className="input" style={{ height: 180 }} value={qrPayload} readOnly />
                  </div>
                ) : (
                  <div className="small">QR will appear here after saving.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Demo Keys</h3>
        <p className="small">Patient private key (demo only): store securely in production.</p>
        <textarea className="input" readOnly value={localPrivKey || "private key will appear after connect (demo)"} />
      </div>

      <div className="card">
        <h3>Status</h3>
        <div className="small">{message}</div>
      </div>
    </div>
  );
}
