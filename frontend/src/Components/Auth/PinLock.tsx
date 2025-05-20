import React, { useState, useRef, useEffect } from 'react';
import Button from '../UI/Button';

interface PinLockProps {
  onVerify: (pin: string) => boolean;
  onSuccess: () => void;
  pinLength?: number;
  maxAttempts?: number;
}

const PinLock: React.FC<PinLockProps> = ({
  onVerify,
  onSuccess,
  pinLength = 4,
  maxAttempts = 5
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  
  const inputRefs = useRef<HTMLInputElement[]>([]);
  
  // Set up initial input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, pinLength);
  }, [pinLength]);
  
  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  // Handle lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((lockoutUntil.getTime() - now.getTime()) / 1000));
      
      setRemainingTime(timeLeft);
      
      if (timeLeft <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lockoutUntil]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the pin state
    const newPin = pin.split('');
    newPin[index] = value.slice(-1); // Only keep the last character if multiple are entered
    const updatedPin = newPin.join('');
    setPin(updatedPin);
    
    // Focus next input if this one is filled
    if (value && index < pinLength - 1) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1].focus();
        
        // Clear the previous digit
        const newPin = pin.split('');
        newPin[index - 1] = '';
        setPin(newPin.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < pinLength - 1) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Only proceed if the pasted data contains only digits
    if (!/^\d+$/.test(pastedData)) return;
    
    // Take only the first pinLength characters
    const validPin = pastedData.slice(0, pinLength);
    setPin(validPin);
    
    // Focus the last filled input
    if (validPin.length < pinLength) {
      inputRefs.current[validPin.length].focus();
    } else {
      inputRefs.current[pinLength - 1].focus();
    }
  };
  
  // Handle verification
  const handleVerify = () => {
    // Check if pin is complete
    if (pin.length !== pinLength) {
      setError(`Please enter all ${pinLength} digits`);
      return;
    }
    
    // Check if locked out
    if (lockoutUntil && lockoutUntil > new Date()) {
      return;
    }
    
    // Verify pin
    const isValid = onVerify(pin);
    
    if (isValid) {
      setError(null);
      onSuccess();
    } else {
      // Increment attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Handle lockout
      if (newAttempts >= maxAttempts) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 5); // 5-minute lockout
        setLockoutUntil(lockoutTime);
        setError(`Too many failed attempts. Try again in 5 minutes.`);
      } else {
        setError(`Invalid PIN. ${maxAttempts - newAttempts} attempts remaining.`);
      }
      
      // Clear pin
      setPin('');
      inputRefs.current[0].focus();
    }
  };
  
  // Format remaining time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div>
      {lockoutUntil && remainingTime > 0 ? (
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Account is temporarily locked due to too many failed attempts.
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            {formatTime(remainingTime)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Please try again after the timer expires.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex justify-center">
            {[...Array(pinLength)].map((_, index) => (
              <input
                key={index}
                ref={(el) => el && (inputRefs.current[index] = el)}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={pin[index] || ''}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="w-12 h-12 mx-1 text-center text-xl border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
              />
            ))}
          </div>
          
          {error && (
            <div className="mb-4 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={handleVerify}
              disabled={pin.length !== pinLength}
            >
              Unlock
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PinLock;