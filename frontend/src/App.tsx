import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './Contexts/ThemeContext';
import { AuthProvider } from './Contexts/AuthContext';
import { ChatProvider } from './Contexts/ChatContext';
import AppRoutes from './Routes/routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import ConnectionStatus from './components/common/ConnectionStatus';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <Router>
              <AppRoutes />
              <ConnectionStatus />
            </Router>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;