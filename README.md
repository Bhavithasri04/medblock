# 🏥 MedBlock: Decentralized Medical Data Access on Aptos

## 👥 Team Name

**Team Medblock**

## 🧑‍🤝‍🧑 Team Members

| Name                 | Email                                                     | LinkedIn                                                                                                   |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Bhavitha Sri Kagitha | [22501a0570@pvpsit.ac.in](mailto:22501a0570@pvpsit.ac.in) | [https://www.linkedin.com/in/bhavitha-sri-kagitha](https://www.linkedin.com/in/bhavitha-sri-kagitha)       |
| K. Gnana Sri         | [22501a0597@pvpsit.ac.in](mailto:22501a0582@pvpsit.ac.in) | [https://www.linkedin.com/in/kemisetti-gnana-sri](https://www.linkedin.com/in/kemisetti-gnana-sri)         |
| Swetha Sree Lanka    | [22501a0582@pvpsit.ac.in](mailto:22501a0597@pvpsit.ac.in) | [https://www.linkedin.com/in/swetha-lanka-a5b18825b/](https://www.linkedin.com/in/swetha-lanka-a5b18825b/) |

--- 
## ❗ Problem Statement

Hospitals and cloud providers hold sensitive medical records in centralized silos, creating risks of tampering, data leaks, and access without patient consent. Patients lack fine‑grained, revocable control over who can read their records. We need a **decentralized, patient‑owned access layer** that:

* stores only **encrypted blobs** on‑chain / decentralized storage metadata,
* lets patients **authorize or revoke** specific doctors,
* ensures doctors can read data **only if the patient has granted access**—with full auditability and no trusted intermediary.

---

## 📖 Project Description

**MedBlock** is a minimal, privacy‑first records sharing protocol on **Aptos**. Patients keep ownership of their encrypted medical data and selectively share a per‑doctor encrypted symmetric key. Doctors can fetch the encrypted blob and their key **only if authorized**.

**What’s stored on‑chain?**

* Patient’s encrypted data blob identifier (string) and IV (string)
* A mapping between authorized doctor addresses and the **doctor‑specific encrypted symmetric key**

**What stays off‑chain?**

* Raw medical data (encrypted with a symmetric key)
* Decryption happens client‑side after a doctor obtains their encrypted key

---

## 🧠 Smart Contracts (Move)

**Module:** `medb::medblock`
**Deployed address (module owner):** `0x99fce224315f201b24ac1f4cf5fc2f12b7073357992374f1378121a720f6a214`

### Key Data Structure

```move
struct PatientVault has key {
  owner: address,
  encrypted_blob: string::String,
  iv: string::String,
  doctor_addrs: vector<address>,
  doctor_keys: vector<string::String>,
}
```

### Key Variables (by field)

* **owner (address):** Patient account that owns this vault.
* **encrypted\_blob (string):** Identifier/contents of the patient’s encrypted record (e.g., IPFS CID or opaque ciphertext).
* **iv (string):** Initialization vector (IV) used when encrypting the blob.
* **doctor\_addrs (vector<address>):** List of authorized doctors.
* **doctor\_keys (vector<string>):** Per‑doctor **encrypted symmetric key** aligned by index with `doctor_addrs`.

### Functions

* `public entry fun register_or_update_patient_blob(patient, encrypted_blob, iv)`

  * Creates the patient’s vault if missing, or updates `encrypted_blob` and `iv`.
* `public entry fun authorize_doctor(patient, doctor_addr, encrypted_sym_key_for_doctor)`

  * Adds or updates a doctor’s entry and stores the **doctor‑specific encrypted key**.
* `public fun has_vault(patient_addr): bool`

  * Returns `true` if a `PatientVault` exists at `patient_addr`.
* `public fun get_patient_data(patient_addr, doctor_addr): (string, string)`

  * If `doctor_addr` is authorized, returns `(encrypted_blob, encrypted_sym_key_for_doctor)`.
* `public entry fun revoke_doctor(patient, doctor_addr)`

  * Removes a doctor from the patient’s authorization lists.

---

## 🖥️ Frontend (React + Aptos SDK)

### Components

* **`Patient.jsx`**

  * Connect Petra wallet
  * `register_or_update_patient_blob` (upload/update encrypted blob + IV)
  * `authorize_doctor` (store per‑doctor encrypted symmetric key)
* **`Doctor.jsx`**

  * Connect Petra wallet
  * `get_patient_data` (fetch encrypted blob + the doctor’s encrypted key)
* **`App.jsx`** — Role switcher (Patient / Doctor)
* **`main.jsx`** — Wallet adapter wiring (Petra), `autoConnect` disabled by default
  
---

## 🏗️ Project Structure

```
root/
├─ move/
│  ├─ Move.toml
│  └─ sources/
│     └─ medblock.move
└─ web/
   ├─ src/
   │  ├─ App.jsx
   │  ├─ main.jsx
   │  └─ components/
   │     ├─ Patient.jsx
   │     └─ Doctor.jsx
   └─ package.json
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* Petra Wallet extension
* Aptos CLI (optional, for on‑chain verification)

### Frontend

```bash
cd web
npm install
npm run dev
```

Open the local URL, connect Petra, and switch between **Patient** and **Doctor** roles.

### Move (Aptos)

```bash
cd move
aptos init # if needed
aptos move compile
aptos move publish --named-addresses medb=0x99fce2...a214
```

---

## 🧪 Usage Flows

### Patient

1. Connect wallet
2. Paste/upload your **encrypted blob** and its **IV** → **Register / Update**
3. Paste doctor’s **address** and their **encrypted symmetric key** → **Authorize Doctor**
4. (Optional) **Revoke** a doctor later

### Doctor

1. Connect wallet (as the doctor)
2. Enter patient’s address → **Get Patient Data**
3. Receive `(encryptedBlob, encryptedKey)` and decrypt locally

---

### Screenshots

![WhatsApp Image 2025-08-18 at 23 43 50_d7aa11fd](https://github.com/user-attachments/assets/650e0852-4cd9-487c-b5d7-deb9c9d457ae)
![WhatsApp Image 2025-08-18 at 23 43 58_c4449cba](https://github.com/user-attachments/assets/9ec05498-526b-4536-b81a-69145f242247)
![WhatsApp Image 2025-08-18 at 23 44 21_562c7d7f](https://github.com/user-attachments/assets/5b75f5aa-5d83-4a03-92c9-5b4aff95879f)
![WhatsApp Image 2025-08-18 at 23 44 39_6a65c25e](https://github.com/user-attachments/assets/71b708e7-dc4b-4385-82b8-c2f68deb81c3)
![WhatsApp Image 2025-08-18 at 23 45 14_889c6a10](https://github.com/user-attachments/assets/4cf0b8cc-9222-490e-8b54-1d035191576b)

