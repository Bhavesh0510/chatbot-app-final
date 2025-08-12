// src/components/SignIn.js
import React, { useState } from 'react';
import { useSignInEmailPassword } from '@nhost/react';
import { Link, useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInEmailPassword, isLoading, error } = useSignInEmailPassword();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isSuccess } = await signInEmailPassword(email, password);
    if (isSuccess) {
      navigate('/'); // Redirect to chat list on successful sign-in
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {error && <p className="error-message">Error: {error.message}</p>}
      <p className="auth-link-text">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
};

export default SignIn;