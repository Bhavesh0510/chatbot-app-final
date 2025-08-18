// src/components/ChatList.js
import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useSignOut, useUserData } from '@nhost/react';

// GraphQL query to fetch all chats for the authenticated user
const GET_CHATS = gql`
  query GetChats($userId: uuid!) {
    chats(where: { user_id: { _eq: $userId } }, order_by: { created_at: asc }) {
      id
      user_id
      created_at
    }
  }
`;

//Error loading chats: field 'created_at' not found in type: 'chats_order_by' 
// this error indicates that the 'created_at' field is not defined in the 'chats_order_by' type in your GraphQL schema. 
// You may need to check your schema definition and ensure that 'created_at' is included in the 'chats_order_by' type if you want to order chats by creation date.
// If you are using Hasura, ensure that the 'created_at' field is part of the 'chats' table and that it is included in the GraphQL schema. If it is not, you may need to modify your database schema or adjust your query accordingly.
// If you are using a different GraphQL server, ensure that the 'created_at' field is defined in the schema for the 'chats' type and that it can be used for ordering.
// If you are using a custom GraphQL server, ensure that the 'created_at' field is defined in the schema for the 'chats' type and that it can be used for ordering.


// GraphQL mutation to create a new chat
const CREATE_CHAT = gql`
  mutation InsertChats($user_id: uuid!) {
  insert_chats(objects: {user_id: $user_id}) {
    affected_rows
    returning {
      created_at
			id
			user_id
    }
  }
}
`;

const ChatList = () => {
  const userData = useUserData();
  const userId = userData?.id;
  const { data, loading, error } = useQuery(GET_CHATS, {
    skip: !userId,
    variables: { userId },
  });
  const [createChat] = useMutation(CREATE_CHAT, {
    // After creating a new chat, refetch the chat list to update the UI
    refetchQueries: userId ? [{ query: GET_CHATS, variables: { userId } }] : [],
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
      <button
        onClick={() => userId && createChat({ variables: { user_id: userId } })}
        className="btn-primary new-chat-btn"
        disabled={!userId}
      >
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