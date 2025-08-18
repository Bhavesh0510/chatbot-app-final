// src/components/ChatList.js
import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useSignOut } from '@nhost/react';

// GraphQL query to fetch all chats for the authenticated user
const GET_CHATS = gql`
  query GetChats {
    chats(order_by: { created_at: desc }) {
      id
      created_at
    }
  }
`;

// GraphQL mutation to create a new chat
const CREATE_CHAT = gql`
  mutation CreateChat {
    insert_chats_one(object: {}) {
      id
    }
  }
`;

const ChatList = () => {
  const { data, loading, error } = useQuery(GET_CHATS);
  const [createChat] = useMutation(CREATE_CHAT, {
    // After creating a new chat, refetch the chat list to update the UI
    refetchQueries: [{ query: GET_CHATS }],
  });
  const { signOut } = useSignOut();

  if (loading) return <p className="loading-message">Loading chats...</p>;
  if (error) return <p className="error-message">Error loading chats: {error.message}</p>;

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Your Chats</h2>
        <button onClick={signOut} className="btn-secondary">
          Sign Out
        </button>
      </div>
      <button onClick={createChat} className="btn-primary new-chat-btn">
        Start New Chat
      </button>
      {data.chats.length === 0 ? (
        <p className="no-chats-message">No chats yet. Click "Start New Chat" to begin!</p>
      ) : (
        <ul className="chat-list">
          {data.chats.map((chat) => (
            <li key={chat.id} className="chat-list-item">
              <Link to={`/chat/${chat.id}`} className="chat-link">
                Chat created on {new Date(chat.created_at).toLocaleDateString()}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;