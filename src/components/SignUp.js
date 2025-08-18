// src/components/SignUp.js
import React, { useState } from 'react';
import { useSignUpEmailPassword } from '@nhost/react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUpEmailPassword, isLoading, error } = useSignUpEmailPassword();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isSuccess } = await signUpEmailPassword(email, password);
    if (isSuccess) {
      alert('Sign up successful! Please check your email to verify your account.');
      navigate('/signin'); // Redirect to sign-in after successful sign-up
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
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
            placeholder="Choose a password"
            required
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      {error && <p className="error-message">Error: {error.message}</p>}
      <p className="auth-link-text">
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </div>
  );
};

export default SignUp;