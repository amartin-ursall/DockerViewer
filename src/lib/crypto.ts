// A simple salt for PBKDF2. In a real app, this might be unique per user or app instance.
const SALT = new TextEncoder().encode('nautica-ssh-docker-salt');
const IV_LENGTH = 12; // bytes for AES-GCM
const KEY_ALGO = { name: 'PBKDF2' };
const ENCRYPT_ALGO = { name: 'AES-GCM', iv: new Uint8Array(IV_LENGTH) };
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    KEY_ALGO,
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
/**
 * Encrypts a JSON-serializable object into a base64 string.
 * @param keyPhrase A secret phrase to derive the encryption key.
 * @param value The object to encrypt.
 * @returns A promise that resolves to a base64 encoded ciphertext string.
 */
export async function encryptJSON<T>(keyPhrase: string, value: T): Promise<string> {
  try {
    const key = await deriveKey(keyPhrase);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const plaintext = new TextEncoder().encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt(
      { ...ENCRYPT_ALGO, iv },
      key,
      plaintext
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Could not encrypt data.");
  }
}
/**
 * Decrypts a base64 string (encrypted by encryptJSON) back into an object.
 * @param keyPhrase The secret phrase used for encryption.
 * @param base64Cipher The base64 encoded ciphertext.
 * @returns A promise that resolves to the decrypted object.
 */
export async function decryptJSON<T>(keyPhrase: string, base64Cipher: string): Promise<T> {
  try {
    const key = await deriveKey(keyPhrase);
    const combined = new Uint8Array(Array.from(atob(base64Cipher), c => c.charCodeAt(0)));
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    const decrypted = await crypto.subtle.decrypt(
      { ...ENCRYPT_ALGO, iv },
      key,
      ciphertext
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Could not decrypt data. Invalid key or corrupted data.");
  }
}