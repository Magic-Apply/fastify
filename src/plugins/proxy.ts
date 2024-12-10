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
		rewritePrefix: `/${process.env.INTERNAL_API_OPERATIONS_PATH}/`, // Fix trailing slash, make condidional on empty /
		preHandler: async (request, reply) => {
			// If method is DELETE or PATCH, rewrite to POST
			if (['DELETE', 'PATCH', 'PUT'].includes(request.method)) {
				request.headers['x-http-method-override'] = request.method;
				request.raw.method = 'POST';
			}
		},
		replyOptions: {
			rewriteRequestHeaders: (originalReq, headers) => {
				// Preserve original Host and Origin headers
				return {
					...headers,
					host: originalReq.host,
					origin: originalReq.originalUrl,
				};
			},
		},
	});

	// Proxy for webhooks with custom options
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_WEBHOOKS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_WEBHOOKS_PATH}/`,
		replyOptions: {
			rewriteRequestHeaders: (originalReq, headers) => {
				// Preserve original Host and Origin headers
				return {
					...headers,
					host: originalReq.host,
					origin: originalReq.originalUrl,
				};
			},
		},
	});
});
