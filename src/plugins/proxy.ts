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
		replyOptions: {
			rewriteRequestHeaders: (fastifyRequest, originalHeaders) => {
				fastify.log.info('Original Headers:', originalHeaders);
				fastify.log.info('Fastify Request Headers:', fastifyRequest.headers);
				return originalHeaders
			}
		}
		// preHandler: async (request, reply) => {
		// 	// Log the original client request headers
		// 	fastify.log.info('Original Request Headers:', request.headers);

		// 	// If method is DELETE or PATCH, rewrite to POST
		// 	if (['DELETE', 'PATCH', 'PUT'].includes(request.method)) {
		// 			request.headers['x-http-method-override'] = request.method;
		// 			request.raw.method = 'POST';
		// 	}

		// 	// Store original Host and Origin headers for later use
		// 	request.headers['x-original-host'] = request.headers.host;
		// 	request.headers['x-original-origin'] = request.headers.origin;
		// },
		// replyOptions: {
		// 	rewriteRequestHeaders: (originalReq, headers) => {
		// 		// Log the headers before rewriting
		// 		fastify.log.info('Headers before rewrite:', headers);

		// 		// Retrieve original headers stored in preHandler
		// 		const originalHost = headers['x-original-host'] as string || headers.host;
		// 		const originalOrigin = headers['x-original-origin'] as string || headers.origin;

		// 		// Remove custom headers to prevent them from being sent upstream
		// 		delete headers['x-original-host'];
		// 		delete headers['x-original-origin'];

		// 		// Preserve original Host and Origin headers
		// 		const newHeaders = {
		// 			...headers,
		// 			host: originalHost,
		// 			origin: originalOrigin,
		// 		};

		// 		// Log the headers after rewriting
		// 		fastify.log.info('Headers after rewrite:', newHeaders);

		// 		return newHeaders;
		// 	},
		// },
	});

	// Proxy for webhooks with custom options
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_WEBHOOKS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_WEBHOOKS_PATH}/`,
		replyOptions: {
			rewriteRequestHeaders: (fastifyRequest, originalHeaders) => {
				fastify.log.info('Original Headers:', originalHeaders);
				fastify.log.info('Fastify Request Headers:', fastifyRequest.headers);
				return originalHeaders
			}
		}
		// preHandler: async (request, reply) => {
		// 	// Log the original client request headers
		// 	fastify.log.info('Original Request Headers:', request.headers);

		// 	// Store original Host and Origin headers for later use
		// 	request.headers['x-original-host'] = request.headers.host;
		// 	request.headers['x-original-origin'] = request.headers.origin;
		// },
		// replyOptions: {
		// 	rewriteRequestHeaders: (originalReq, headers) => {
		// 		// Log the headers before rewriting
		// 		fastify.log.info('Headers before rewrite:', headers);

		// 		// Retrieve original headers stored in preHandler
		// 		const originalHost = headers['x-original-host'] as string || headers.host;
		// 		const originalOrigin = headers['x-original-origin'] as string || headers.origin;

		// 		// Remove custom headers to prevent them from being sent upstream
		// 		delete headers['x-original-host'];
		// 		delete headers['x-original-origin'];

		// 		// Preserve original Host and Origin headers
		// 		const newHeaders = {
		// 			...headers,
		// 			host: originalHost,
		// 			origin: originalOrigin,
		// 		};

		// 		// Log the headers after rewriting
		// 		fastify.log.info('Headers after rewrite:', newHeaders);

		// 		return newHeaders;
		// 	},
		// },
	});
});
