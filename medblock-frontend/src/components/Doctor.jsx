import React, { useState, useEffect } from "react";
import * as cryptoUtils from "../utils/crypto";
import { aptosClient } from "../utils/aptosClient";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import "./common.css";

// Move module
const MODULE_ADDRESS = "0xb91a67f12134a80bb35b194eb8ae585f5250bd5805006cefd9c8b2db5eb14970";
const AUTHORIZE_FN = `${MODULE_ADDRESS}::medblock::authorize_doctor`;

export default function Doctor() {
  const { connect, account, connected, signTransaction, signAndSubmitTransaction, disconnect } = useWallet();

  const [addr, setAddr] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [decrypted, setDecrypted] = useState(null);
  const [doctorKeyPair, setDoctorKeyPair] = useState(null);
  const [message, setMessage] = useState("");

  const [authorizePatientAddr, setAuthorizePatientAddr] = useState("");
  const [authorizeEncryptedSymKey, setAuthorizeEncryptedSymKey] = useState("");

  useEffect(() => {
    (async () => {
      
      if (connected && account?.address) setAddr(account.address);
    })();
  }, [connected, account]);

 async function handleConnect() {
  try {
    connect(); // no await here
    setMessage("Connecting wallet...");

    // Wait until account is ready
    const checkAccount = setInterval(() => {
      if (account?.address) {
        clearInterval(checkAccount);
        setMessage("Wallet connected: " + account.address);
        cryptoUtils.generateRsaKeyPair().then(setDoctorKeyPair);
      }
    }, 250);
  } catch (e) {
    console.error(e);
    setMessage("Connect failed: " + (e.message || e));
  }
}



    async function handlePasteQR() {
    setMessage("Parsing QR...");
    try {
      const qr = JSON.parse(scanInput);
      if (!qr?.patientAddress || !qr?.demo_sym_key) {
        throw new Error("QR missing patientAddress or demo_sym_key");
      }
      const sym = await cryptoUtils.importSymKeyRaw(qr.demo_sym_key);

      setMessage("Fetching patient data from chain...");
      // Read the PatientVault resource from chain
      const resourceType = `${MODULE_ADDRESS}::medblock::PatientVault`;
      const res = await aptosClient.getAccountResource(qr.patientAddress, resourceType);

      // Expect struct fields from Move
      const { encrypted_blob, iv } = res.data;
      setMessage("Decrypting...");
      const plain = await cryptoUtils.aesDecrypt(sym, iv, encrypted_blob);
      setDecrypted(plain);
      setMessage("Decrypted successfully.");
    } catch (e) {
      console.error(e);
      setMessage("QR or decryption error: " + (e.message || e));
    }
  }


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

  async function handleAuthorizeDoctor() {
    try {
      if (!authorizePatientAddr || !authorizeEncryptedSymKey) {
        setMessage("Provide patient address and encrypted symmetric key.");
        return;
      }
      setMessage("Submitting authorize_doctor transaction...");
      const payload = {
        type: "entry_function_payload",
        function: AUTHORIZE_FN,
        type_arguments: [],
        arguments: [authorizePatientAddr, authorizeEncryptedSymKey],
      };
      const txRes = await submitWithSim(payload);
      setMessage("Doctor authorized (tx): " + JSON.stringify(txRes));
    } catch (e) {
      console.error(e);
      setMessage("Authorize failed: " + (e.message || e));
    }
  }

  return (
    <div>
      <div className="card">
        <h2>Doctor Dashboard</h2>

        {/* Manual connect flow */}
        {!connected ? (
          <div>
            <button className="primary" onClick={handleConnect}>
              Connect Wallet
            </button>
            <p className="small">
              Doctor should publish a public key so patients can encrypt symmetric keys for them.
            </p>
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
                setDoctorKeyPair(null);
              }}
            >
              Disconnect
            </button>

            <div className="row">
              <div className="col">
                <label className="small">Paste QR payload (JSON)</label>
                <textarea
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="input"
                  rows={8}
                />
                <div style={{ marginTop: 8 }}>
                  <button className="primary" onClick={handlePasteQR}>
                    Scan / Paste QR
                  </button>
                </div>
              </div>

              <div className="col">
                <h4>Doctor Keys (demo)</h4>
                {doctorKeyPair ? (
                  <div>
                    <p className="small">Public Key (share with patient):</p>
                    <textarea readOnly className="input" value={doctorKeyPair.publicKey} rows={6} />
                    <p className="small">Private Key (keep secret):</p>
                    <textarea readOnly className="input" value={doctorKeyPair.privateKey} rows={6} />
                  </div>
                ) : (
                  <div className="small">Doctor keypair will be generated after connect.</div>
                )}
              </div>
            </div>

            <hr />

            <h4>Authorize doctor (demo)</h4>
            <div className="small">
              Stores an encrypted symmetric key for this doctor under the patient's vault.
            </div>
            <label className="small">Patient Address</label>
            <input
              className="input"
              value={authorizePatientAddr}
              onChange={(e) => setAuthorizePatientAddr(e.target.value)}
              placeholder="0x..."
            />
            <label className="small">Encrypted Symmetric Key (base64 string)</label>
            <textarea
              className="input"
              value={authorizeEncryptedSymKey}
              onChange={(e) => setAuthorizeEncryptedSymKey(e.target.value)}
              rows={4}
            />
            <div style={{ marginTop: 8 }}>
              <button className="primary" onClick={handleAuthorizeDoctor}>
                Call authorize_doctor
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Decrypted Patient Data</h3>
        <textarea
          className="input"
          readOnly
          value={decrypted || "Decrypted data will appear here"}
          rows={8}
        />
      </div>

      <div className="card">
        <h3>Status</h3>
        <div className="small">{message}</div>
      </div>
    </div>
  );
}
