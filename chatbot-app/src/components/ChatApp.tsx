import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { CREATE_CHAT, GET_CHATS, GET_MESSAGES, INSERT_USER_MESSAGE, MESSAGES_SUBSCRIPTION, SEND_MESSAGE_ACTION } from '../graphql/operations';

export default function ChatApp() {
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [newChatTitle, setNewChatTitle] = useState('New chat');
	const [input, setInput] = useState('');
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const { data: chatsData, loading: chatsLoading, refetch: refetchChats } = useQuery(GET_CHATS);
	const chats = chatsData?.chats ?? [];

	const { data: messagesData } = useQuery(GET_MESSAGES, {
		skip: !selectedChatId,
		variables: { chat_id: selectedChatId }
	});

	useSubscription(MESSAGES_SUBSCRIPTION, {
		skip: !selectedChatId,
		variables: { chat_id: selectedChatId }
	});

	const [createChat, { loading: creatingChat }] = useMutation(CREATE_CHAT, {
		onCompleted: async (res) => {
			setSelectedChatId(res.insert_chats_one.id);
			await refetchChats();
		}
	});

	const [insertUserMessage, { loading: insertingMessage }] = useMutation(INSERT_USER_MESSAGE);
	const [sendMessageAction, { loading: sendingToBot }] = useMutation(SEND_MESSAGE_ACTION);

	const messages = useMemo(() => messagesData?.messages ?? [], [messagesData]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const onCreateChat = async () => {
		if (!newChatTitle.trim()) return;
		await createChat({ variables: { title: newChatTitle.trim() } });
		setNewChatTitle('New chat');
	};

	const onSend = async () => {
		if (!selectedChatId || !input.trim()) return;
		const content = input.trim();
		setInput('');
		await insertUserMessage({ variables: { chat_id: selectedChatId, content } });
		await sendMessageAction({ variables: { chat_id: selectedChatId, content } });
	};

	return (
		<div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '80vh', gap: 12 }}>
			<div style={{ borderRight: '1px solid #ddd', paddingRight: 12, display: 'flex', flexDirection: 'column' }}>
				<h3>Chats</h3>
				<div style={{ display: 'flex', gap: 8 }}>
					<input
						value={newChatTitle}
						onChange={(e) => setNewChatTitle(e.target.value)}
						placeholder="Chat title"
						style={{ flex: 1 }}
					/>
					<button onClick={onCreateChat} disabled={creatingChat}>New</button>
				</div>
				<div style={{ marginTop: 12, overflowY: 'auto' }}>
					{chatsLoading ? (
						<div>Loading chats...</div>
					) : (
						chats.map((c: any) => (
							<div
								key={c.id}
								onClick={() => setSelectedChatId(c.id)}
								style={{
									padding: 8,
									cursor: 'pointer',
									background: selectedChatId === c.id ? '#eef' : 'transparent',
									borderRadius: 6
								}}
							>
								<div style={{ fontWeight: 600 }}>{c.title}</div>
							</div>
						))
					)}
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
					{selectedChatId ? (
						<div>
							{messages.map((m: any) => (
								<div key={m.id} style={{ margin: '8px 0', display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
									<div style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 12, background: m.role === 'user' ? '#cfe9ff' : '#f2f2f2' }}>
										<div style={{ fontSize: 12, color: '#666' }}>{m.role}</div>
										<div>{m.content}</div>
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>
					) : (
						<div style={{ color: '#666' }}>Select a chat to start</div>
					)}
				</div>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type a message..."
						style={{ flex: 1, padding: 8 }}
						disabled={!selectedChatId}
					/>
					<button onClick={onSend} disabled={!selectedChatId || insertingMessage || sendingToBot}>Send</button>
				</div>
			</div>
		</div>
	);
}