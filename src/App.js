// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { NhostApolloProvider } from '@nhost/react-apollo';
import { NhostProvider, useAuthenticated, useUserData } from '@nhost/react';
import { nhost, apolloClient } from './nhost';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import ChatList from './components/ChatList';
import ChatView from './components/ChatView';

// A component to protect routes, redirecting unauthenticated users to sign-in
const AuthenticatedRoute = ({ children }) => {
  const isAuthenticated = useAuthenticated();
  const user = useUserData(); // Get user data to ensure the user is fully loaded
  // If not authenticated, redirect to signin.
  // If authenticated but user data isn't loaded yet, show a loading message.
  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }
  if (!user) {
    return <p>Loading user data...</p>; // Or a proper loading spinner
  }
  return children;
};

function App() {
  return (
    // Wrap the entire app with NhostProvider for authentication context
    <NhostProvider nhost={nhost}>
      {/* Wrap with NhostApolloProvider to connect Apollo Client to Nhost's auth */}
      <NhostApolloProvider nhost={nhost} apolloClient={apolloClient}>
        <Router>
          <div className="App">
            <header className="App-header">
              <h1>Nhost Chatbot</h1>
            </header>
            <main className="App-main">
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/"
                  element={
                    <AuthenticatedRoute>
                      <ChatList />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/chat/:chatId"
                  element={
                    <AuthenticatedRoute>
                      <ChatView />
                    </AuthenticatedRoute>
                  }
                />
                {/* Redirect any unmatched routes to the home page (which is authenticated) */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </NhostApolloProvider>
    </NhostProvider>
  );
}

export default App;