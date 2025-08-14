// src/utils/crypto.js
// Uses Web Crypto APIs. All functions return or accept Uint8Array/base64 strings.
// Helper utilities for AES-GCM and RSA-OAEP hybrid operations.

const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuf(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function generateSymKey() {
  // AES-GCM 256
  return await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportSymKeyRaw(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufToBase64(raw);
}

export async function importSymKeyRaw(base64) {
  const raw = base64ToBuf(base64);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function aesEncrypt(key, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return {
    iv: bufToBase64(iv),
    ciphertext: bufToBase64(ct),
  };
}

export async function aesDecrypt(key, ivBase64, ciphertextBase64) {
  const iv = base64ToBuf(ivBase64);
  const ct = base64ToBuf(ciphertextBase64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ct);
  return dec.decode(plain);
}

/* RSA-OAEP functions: these are used to encrypt/decrypt the symmetric key.
   In a real deployment:
   - Doctors should generate key pairs and publish their public key (on-chain or via a trusted registry).
   - Patients will encrypt the symmetric key with doctor's public key when authorizing the doctor.
*/

export async function generateRsaKeyPair() {
  const kp = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const pub = await crypto.subtle.exportKey("spki", kp.publicKey);
  const priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return {
    publicKey: bufToBase64(pub),
    privateKey: bufToBase64(priv),
  };
}

export async function importPublicKey(spkiBase64) {
  const raw = base64ToBuf(spkiBase64);
  return crypto.subtle.importKey("spki", raw, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

export async function importPrivateKey(pkcs8Base64) {
  const raw = base64ToBuf(pkcs8Base64);
  return crypto.subtle.importKey("pkcs8", raw, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}

export async function rsaEncryptPublic(spkiBase64, dataUint8) {
  const pubK = await importPublicKey(spkiBase64);
  const ct = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubK, dataUint8);
  return bufToBase64(ct);
}

export async function rsaDecryptPrivate(pkcs8Base64, ciphertextBase64) {
  const priv = await importPrivateKey(pkcs8Base64);
  const ct = base64ToBuf(ciphertextBase64);
  const plain = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, priv, ct);
  return new Uint8Array(plain);
}
