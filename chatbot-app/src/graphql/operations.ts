import { gql } from '@apollo/client';

export const GET_CHATS = gql`
	query GetChats {
		chats(order_by: { created_at: desc }) {
			id
			title
			created_at
		}
	}
`;

export const CREATE_CHAT = gql`
	mutation CreateChat($title: String!) {
		insert_chats_one(object: { title: $title }) {
			id
			title
			created_at
		}
	}
`;

export const GET_MESSAGES = gql`
	query GetMessages($chat_id: uuid!) {
		messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
			id
			role
			content
			created_at
		}
	}
`;

export const MESSAGES_SUBSCRIPTION = gql`
	subscription OnMessages($chat_id: uuid!) {
		messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
			id
			role
			content
			created_at
		}
	}
`;

export const INSERT_USER_MESSAGE = gql`
	mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
		insert_messages_one(object: { chat_id: $chat_id, role: "user", content: $content }) {
			id
			chat_id
			content
			role
			created_at
		}
	}
`;

export const SEND_MESSAGE_ACTION = gql`
	mutation SendMessage($chat_id: uuid!, $content: String!) {
		sendMessage(chat_id: $chat_id, content: $content) {
			reply_content
		}
	}
`;