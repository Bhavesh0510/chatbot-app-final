import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthenticationStatus, useSignInEmailPassword, useSignUpEmailPassword, useSignOut } from '@nhost/react';

export default function AuthForm() {
	const { isAuthenticated } = useAuthenticationStatus();
	const { signInEmailPassword, isLoading: isSigningIn, error: signInError } = useSignInEmailPassword();
	const { signUpEmailPassword, isLoading: isSigningUp, error: signUpError } = useSignUpEmailPassword();
	const { signOut } = useSignOut();

	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (isSignUp) {
			await signUpEmailPassword(email, password);
		} else {
			await signInEmailPassword(email, password);
		}
	};

	if (isAuthenticated) {
		return (
			<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
				<span>Signed in as {email || 'your account'}</span>
				<button onClick={() => signOut()}>Sign out</button>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
			<input
				type="email"
				placeholder="Email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				required
				style={{ padding: 8 }}
			/>
			<input
				type="password"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
				style={{ padding: 8 }}
			/>
			<button type="submit" disabled={isSigningIn || isSigningUp}>
				{isSignUp ? 'Sign Up' : 'Sign In'}
			</button>
			<button type="button" onClick={() => setIsSignUp((v) => !v)}>
				Switch to {isSignUp ? 'Sign In' : 'Sign Up'}
			</button>
			{signInError && <div style={{ color: 'red', width: '100%' }}>{signInError.message}</div>}
			{signUpError && <div style={{ color: 'red', width: '100%' }}>{signUpError.message}</div>}
		</form>
	);
}