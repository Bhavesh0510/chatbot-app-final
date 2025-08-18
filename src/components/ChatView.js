// src/components/ChatView.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubscription, useMutation, gql } from '@apollo/client';

// GraphQL subscription to get real-time messages for a specific chat
const GET_MESSAGES = gql`
  subscription GetMessages($chatId: uuid!) {
    messages(where: { chat_id: { _eq: $chatId } }, order_by: { created_at: asc }) {
      id
      role
      content
      created_at
    }
  }
`;

// GraphQL mutation to insert a new user message into the database
const INSERT_MESSAGE = gql`
  mutation InsertMessage($chatId: uuid!, $content: String!) {
    insert_messages_one(object: { chat_id: $chatId, role: "user", content: $content }) {
      id
      content
      role
    }
  }
`;

// GraphQL mutation to call the Hasura Action (which triggers n8n)
const SEND_MESSAGE_ACTION = gql`
  mutation SendMessageAction($chatId: uuid!, $content: String!) {
    sendMessage(chat_id: $chatId, content: $content) {
      reply_content
    }
  }
`;

const ChatView = () => {
  const { chatId } = useParams();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to bottom

  // Subscribe to messages for the current chat
  const { data, loading, error } = useSubscription(GET_MESSAGES, {
    variables: { chatId },
  });

  // Mutations
  const [insertMessage] = useMutation(INSERT_MESSAGE);
  const [sendMessageAction, { loading: actionLoading }] = useMutation(SEND_MESSAGE_ACTION);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]); // Scroll whenever new messages arrive

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return; // Prevent sending empty messages

    const userMessage = messageText.trim();
    setMessageText(''); // Clear input immediately

    try {
      // 1. Save user message to the database (local update happens via subscription)
      await insertMessage({
        variables: {
          chatId,
          content: userMessage,
        },
      });

      // 2. Call the Hasura Action to trigger the chatbot (n8n workflow)
      // The bot's response will be saved by n8n, which will then appear via subscription
      await sendMessageAction({ variables: { chatId, content: userMessage } });

    } catch (err) {
      console.error('Error sending message:', err);
      // In a real app, you'd show a user-friendly error message
      alert('Failed to send message. Please try again.');
    }
  };

  if (loading) return <p className="loading-message">Loading chat...</p>;
  if (error) return <p className="error-message">Error loading messages: {error.message}</p>;

  const messages = data?.messages || [];

  return (
    <div className="chat-view-container">
      <div className="chat-view-header">
        <Link to="/" className="back-link">
          &larr; Back to Chats
        </Link>
        <h2>Chat with Bot</h2>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <p className="no-messages-message">Start typing to begin your conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble ${message.role === 'assistant' ? 'bot' : 'user'}`}
            >
              <p>{message.content}</p>
              <span className="message-timestamp">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} /> {/* For auto-scrolling */}
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message here..."
          disabled={actionLoading} // Disable input while bot is thinking
        />
        <button type="submit" disabled={actionLoading} className="btn-primary">
          {actionLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatView;