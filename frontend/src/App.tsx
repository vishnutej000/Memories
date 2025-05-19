import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './Contexts/ThemeContext';
import { AuthProvider } from './Contexts/AuthContext';
import { ChatProvider } from './Contexts/ChatContext';
import AppRoutes from './Routes/routes';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;