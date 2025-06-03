import CryptoJS from 'crypto-js';

export class SecurityService {
    private static readonly STORAGE_KEY = 'whatsapp_memory_vault';
    private static readonly PIN_KEY = 'pin_hash';
    private static readonly SALT = 'whatsapp_memory_vault_salt';

    public static async encryptData(data: any, password: string): Promise<string> {
        const key = await this.deriveKey(password);
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    }

    public static async decryptData(encryptedData: string, password: string): Promise<any> {
        try {
            const key = await this.deriveKey(password);
            const bytes = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Error decrypting data:', error);
            throw new Error('Invalid password or corrupted data');
        }
    }

    public static async setPIN(pin: string): Promise<void> {
        const hashedPIN = await this.hashPIN(pin);
        localStorage.setItem(this.PIN_KEY, hashedPIN);
    }

    public static async verifyPIN(pin: string): Promise<boolean> {
        const hashedPIN = await this.hashPIN(pin);
        const storedPIN = localStorage.getItem(this.PIN_KEY);
        return hashedPIN === storedPIN;
    }

    public static async wipeData(): Promise<void> {
        try {
            // Clear all local storage
            localStorage.clear();
            
            // Clear IndexedDB
            const databases = await window.indexedDB.databases();
            for (const db of databases) {
                if (db.name) {
                    window.indexedDB.deleteDatabase(db.name);
                }
            }
            
            // Clear session storage
            sessionStorage.clear();
            
            // Clear cache storage
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (error) {
            console.error('Error wiping data:', error);
            throw new Error('Failed to wipe data');
        }
    }

    public static async exportEncryptedSession(
        sessionData: any,
        password: string
    ): Promise<Blob> {
        const encryptedData = await this.encryptData(sessionData, password);
        const blob = new Blob([encryptedData], { type: 'application/json' });
        return blob;
    }

    public static async importEncryptedSession(
        encryptedBlob: Blob,
        password: string
    ): Promise<any> {
        const encryptedData = await encryptedBlob.text();
        return await this.decryptData(encryptedData, password);
    }

    private static async deriveKey(password: string): Promise<string> {
        const salt = CryptoJS.enc.Hex.parse(this.SALT);
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 1000,
        });
        return key.toString();
    }

    private static async hashPIN(pin: string): Promise<string> {
        const salt = CryptoJS.enc.Hex.parse(this.SALT);
        return CryptoJS.PBKDF2(pin, salt, {
            keySize: 256 / 32,
            iterations: 1000,
        }).toString();
    }
} 