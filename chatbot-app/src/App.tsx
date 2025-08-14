import './App.css';
import { NhostProvider } from '@nhost/react';
import nhost from './nhost';
import { apolloClient } from './apollo';
import { ApolloProvider } from '@apollo/client';
import AuthForm from './components/AuthForm';
import { useAuthenticationStatus } from '@nhost/react';
import ChatApp from './components/ChatApp';

function AuthedApp() {
	const { isAuthenticated } = useAuthenticationStatus();
	return (
		<div style={{ padding: 16 }}>
			<h2>Chatbot App</h2>
			<AuthForm />
			<div style={{ marginTop: 12 }}>
				{isAuthenticated ? <ChatApp /> : <div>Please sign in to continue.</div>}
			</div>
		</div>
	);
}

function App() {
	return (
		<NhostProvider nhost={nhost}>
			<ApolloProvider client={apolloClient}>
				<AuthedApp />
			</ApolloProvider>
		</NhostProvider>
	);
}

export default App;
