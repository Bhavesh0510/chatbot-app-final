// src/components/SignUp.js
import React, { useState } from 'react';
import { useSignUpEmailPassword } from '@nhost/react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // New state for success message
  const { signUpEmailPassword, isLoading, error } = useSignUpEmailPassword();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(''); // Clear any previous success message

    const { isSuccess } = await signUpEmailPassword(email, password);

    if (isSuccess) {
      // Set the success message to be displayed on the page
      setSuccessMessage('Sign up successful! Please check your email or spam folder to verify your account.');

      // Wait a moment before redirecting, so the user can see the message
      setTimeout(() => {
        navigate('/signin');
      }, 3000); // Redirect after 3 seconds
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {/* Display the success message at the top of the form */}
      {successMessage && <p className="success-message">{successMessage}</p>}
      
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