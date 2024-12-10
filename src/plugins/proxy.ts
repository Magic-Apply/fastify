// plugins/proxy.ts
import fp from "fastify-plugin";
import httpProxy from "@fastify/http-proxy";

const isProduction = !process.env.RUN_LOCAL || process.env.RUN_LOCAL === 'false';
const upstreamUrl = isProduction ? `${process.env.INTERNAL_API_BASE_URL}` : `${process.env.INTERNAL_API_BASE_URL_LOCAL}`;

export default fp(async (fastify) => {
	// Proxy for operations with error handling
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_OPERATIONS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_OPERATIONS_PATH}`,
		preHandler: async (request, reply) => {
			// If method is DELETE or PATCH, rewrite to POST
			if (request.method === 'DELETE' || request.method === 'PATCH' || request.method === 'PUT') {
				request.headers['x-http-method-override'] = request.method;
				request.raw.method = 'POST';
			}
		},
	});

	// Proxy for webhooks with custom options
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_WEBHOOKS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_WEBHOOKS_PATH}`,
	});
});
