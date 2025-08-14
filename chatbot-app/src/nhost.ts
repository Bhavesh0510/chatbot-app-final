import { NhostClient } from '@nhost/nhost-js';

const nhostSubdomain = import.meta.env.VITE_NHOST_SUBDOMAIN as string | undefined;
const nhostRegion = import.meta.env.VITE_NHOST_REGION as string | undefined;
const nhostBackendUrl = import.meta.env.VITE_NHOST_BACKEND_URL as string | undefined;

const nhost = new NhostClient(
	nhostBackendUrl
		? {
			authUrl: `${nhostBackendUrl}/v1/auth`,
			graphqlUrl: `${nhostBackendUrl}/v1/graphql`,
			storageUrl: `${nhostBackendUrl}/v1/storage`,
			functionsUrl: `${nhostBackendUrl}/v1/functions`
		}
		: { subdomain: nhostSubdomain ?? 'localhost', region: nhostRegion }
);

export default nhost;