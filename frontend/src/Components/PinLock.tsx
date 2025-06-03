import React, { useState, useEffect } from 'react';
import { SecurityService } from '../services/security';

interface PinLockProps {
    onUnlock: () => void;
    onSetup?: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock, onSetup }) => {
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isSetup, setIsSetup] = useState<boolean>(false);
    const [attempts, setAttempts] = useState<number>(0);
    const [locked, setLocked] = useState<boolean>(false);

    useEffect(() => {
        const checkPIN = async () => {
            const hasPIN = localStorage.getItem('pin_hash') !== null;
            setIsSetup(hasPIN);
        };
        checkPIN();
    }, []);

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isSetup) {
            try {
                const isValid = await SecurityService.verifyPIN(pin);
                if (isValid) {
                    setAttempts(0);
                    onUnlock();
                } else {
                    setAttempts(prev => prev + 1);
                    if (attempts >= 2) {
                        setLocked(true);
                        setTimeout(() => {
                            setLocked(false);
                            setAttempts(0);
                        }, 300000); // 5 minutes lockout
                    }
                    setError('Invalid PIN');
                }
            } catch (error) {
                setError('Error verifying PIN');
            }
        } else {
            if (pin.length < 4) {
                setError('PIN must be at least 4 digits');
                return;
            }

            if (pin !== confirmPin) {
                setError('PINs do not match');
                return;
            }

            try {
                await SecurityService.setPIN(pin);
                setIsSetup(true);
                onSetup?.();
            } catch (error) {
                setError('Error setting PIN');
            }
        }
    };

    if (locked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Account Locked</h2>
                    <p className="text-gray-600">
                        Too many failed attempts. Please try again in 5 minutes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center mb-6">
                    {isSetup ? 'Enter PIN' : 'Set Up PIN'}
                </h2>
                <form onSubmit={handlePinSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN"
                            className="w-full p-2 border rounded-lg"
                            maxLength={6}
                            pattern="[0-9]*"
                            inputMode="numeric"
                        />
                    </div>
                    {!isSetup && (
                        <div>
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                placeholder="Confirm PIN"
                                className="w-full p-2 border rounded-lg"
                                maxLength={6}
                                pattern="[0-9]*"
                                inputMode="numeric"
                            />
                        </div>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                        {isSetup ? 'Unlock' : 'Set PIN'}
                    </button>
                </form>
                {attempts > 0 && (
                    <p className="text-red-500 text-sm text-center mt-2">
                        {3 - attempts} attempts remaining
                    </p>
                )}
            </div>
        </div>
    );
};

export default PinLock; 