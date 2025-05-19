/**
 * Simple utility to encrypt/decrypt sensitive data in local storage
 * 
 * Note: This is not meant for high-security applications but provides
 * basic protection for local storage data
 */

// Key for encryption (in a real app, this would be user-provided)
let encryptionKey = '';

/**
 * Set encryption key (e.g., from user password)
 */
export const setEncryptionKey = (key: string) => {
  encryptionKey = key;
};

/**
 * Check if encryption is set up
 */
export const isEncryptionEnabled = (): boolean => {
  return !!encryptionKey;
};

/**
 * Simple encryption function using XOR
 */
export const encrypt = (data: string): string => {
  if (!encryptionKey) return data;
  
  // Convert to Array for manipulation
  const dataChars = Array.from(data);
  const keyChars = Array.from(encryptionKey);
  
  // XOR each character with the key
  const encrypted = dataChars.map((char, i) => {
    const keyChar = keyChars[i % keyChars.length];
    return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
  });
  
  // Convert to Base64 for storage
  return btoa(encrypted.join(''));
};

/**
 * Simple decryption function
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptionKey) return encryptedData;
  
  try {
    // Convert from Base64
    const decoded = atob(encryptedData);
    const dataChars = Array.from(decoded);
    const keyChars = Array.from(encryptionKey);
    
    // XOR each character with the key (reverse of encryption)
    const decrypted = dataChars.map((char, i) => {
      const keyChar = keyChars[i % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    });
    
    return decrypted.join('');
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

/**
 * Encrypt an object
 */
export const encryptObject = <T>(obj: T): string => {
  return encrypt(JSON.stringify(obj));
};

/**
 * Decrypt to an object
 */
export const decryptObject = <T>(encryptedData: string): T | null => {
  try {
    const decrypted = decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Error decrypting object:', error);
    return null;
  }
};