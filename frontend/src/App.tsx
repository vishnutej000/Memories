import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatView from './Components/ChatView';
import DiaryMode from './Components/DiaryMode';
import PinLock from './Components/PinLock';
import { SecurityService } from './services/security';
import { PDFExporter } from './services/pdfExport';
import { ChatMessage, ChatSession } from './types';

const App: React.FC = () => {
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [currentUser, setCurrentUser] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const sessionData = localStorage.getItem('current_session');
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    setCurrentSession(session);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading session:', error);
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setCurrentSession(data);
            localStorage.setItem('current_session', JSON.stringify(data));
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    const handleExportPDF = async () => {
        if (!currentSession) return;

        try {
            await PDFExporter.exportToPDF({
                messages: currentSession.messages,
                currentUser,
                includeAudioQR: true,
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const handleExportSession = async () => {
        if (!currentSession) return;

        try {
            const password = prompt('Enter password for encryption:');
            if (!password) return;

            const encryptedBlob = await SecurityService.exportEncryptedSession(
                currentSession,
                password
            );

            const url = URL.createObjectURL(encryptedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'whatsapp-memory-vault.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting session:', error);
        }
    };

    const handleImportSession = async (file: File) => {
        try {
            const password = prompt('Enter password for decryption:');
            if (!password) return;

            const sessionData = await SecurityService.importEncryptedSession(
                file,
                password
            );

            setCurrentSession(sessionData);
            localStorage.setItem('current_session', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error importing session:', error);
        }
    };

    const handleWipeData = async () => {
        if (window.confirm('Are you sure you want to wipe all data? This cannot be undone.')) {
            try {
                await SecurityService.wipeData();
                setCurrentSession(null);
                setIsUnlocked(false);
            } catch (error) {
                console.error('Error wiping data:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!isUnlocked) {
        return <PinLock onUnlock={() => setIsUnlocked(true)} />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-green-600">
                                    WhatsApp Memory Vault
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleExportPDF}
                                className="px-4 py-2 text-sm text-green-600 hover:text-green-700"
                            >
                                Export PDF
                            </button>
                            <button
                                onClick={handleExportSession}
                                className="px-4 py-2 text-sm text-green-600 hover:text-green-700"
                            >
                                Export Session
                            </button>
                            <button
                                onClick={handleWipeData}
                                className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
                            >
                                Wipe Data
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                        <Route
                            path="/"
                            element={
                                currentSession ? (
                                    <ChatView
                                        sessionId={currentSession.id}
                                        messages={currentSession.messages}
                                        currentUser={currentUser}
                                        onLoadMore={async () => {
                                            // Implement pagination
                                        }}
                                        hasMore={false}
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            No chat session loaded
                                        </h2>
                                        <p className="mt-2 text-gray-600">
                                            Upload a WhatsApp chat export to get started
                                        </p>
                                        <input
                                            type="file"
                                            accept=".txt"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file);
                                            }}
                                            className="mt-4"
                                        />
                                    </div>
                                )
                            }
                        />
                        <Route
                            path="/diary"
                            element={
                                currentSession ? (
                                    <DiaryMode
                                        sessionId={currentSession.id}
                                        messages={currentSession.messages}
                                        currentUser={currentUser}
                                    />
                                ) : (
                                    <Navigate to="/" replace />
                                )
                            }
                        />
                    </Routes>
                </main>
            </div>
        );
};

export default App;