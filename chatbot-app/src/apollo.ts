import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import nhost from './nhost';

const nhostSubdomain = import.meta.env.VITE_NHOST_SUBDOMAIN as string | undefined;
const nhostRegion = import.meta.env.VITE_NHOST_REGION as string | undefined;
const nhostBackendUrl = import.meta.env.VITE_NHOST_BACKEND_URL as string | undefined;

const graphqlHttpUrl = nhostBackendUrl
	? `${nhostBackendUrl}/v1/graphql`
	: `https://${nhostSubdomain}.${nhostRegion}.nhost.run/v1/graphql`;

const graphqlWsUrl = graphqlHttpUrl.replace('https://', 'wss://').replace('http://', 'ws://');

const authLink = setContext(async (_, { headers }) => {
	const token = await nhost.auth.getAccessToken();
	return {
		headers: {
			...headers,
			Authorization: token ? `Bearer ${token}` : ''
		}
	};
});

const httpLink = new HttpLink({ uri: graphqlHttpUrl });

const wsClient = createClient({
	url: graphqlWsUrl,
	connectionParams: async () => {
		const token = await nhost.auth.getAccessToken();
		return {
			headers: {
				Authorization: token ? `Bearer ${token}` : ''
			}
		};
	},
	retryAttempts: 3
});

const wsLink = new GraphQLWsLink(wsClient);

const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
	},
	wsLink,
	authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
	link: splitLink,
	cache: new InMemoryCache(),
	connectToDevTools: true
});