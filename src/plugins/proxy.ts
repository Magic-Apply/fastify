// plugins/proxy.ts
import fp from "fastify-plugin";
import httpProxy from "@fastify/http-proxy";
import { FastifyRequest, FastifyInstance } from "fastify";
const isProduction =
	!process.env.RUN_LOCAL || process.env.RUN_LOCAL === "false";
const upstreamUrl = isProduction
	? `${process.env.INTERNAL_API_BASE_URL}`
	: `${process.env.INTERNAL_API_BASE_URL_LOCAL}`;

export default fp(async (fastify) => {
	// Proxy for operations with error handling
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_OPERATIONS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_OPERATIONS_PATH}/`, // Fix trailing slash, make condidional on empty /
		logLevel: "trace",
		preHandler: async (request, reply) => {
			fastify.log.info(`Request URL: ${request.url}`);
			if (request.url === "/favicon.ico") {
				fastify.log.info(`YOOYOYOYOYO`);
				reply.redirect("/assets/favicon.ico");
				return;
			}
			fastify.log.info('PREHANDLER OPERATIONS');
			printRequest(request, fastify);
		},
		replyOptions: {
			rewriteRequestHeaders: (request, headers) => {
				fastify.log.info('REWRITE OPERATIONS');
				fastify.log.info('Original Headers', {...headers});
				return headers;
				// const newHeaders = {
				// 	...headers,
				// 	host: headers["x-forwarded-host"],
				// 	origin: headers["x-forwarded-origin"],
				// };
				// if (!headers.origin) {
				// 	newHeaders.host = headers["x-forwarded-host"];
				// 	newHeaders.origin = headers["x-forwarded-origin"];
				// }
				// // If method is DELETE or PATCH, rewrite to POST
				// if (["DELETE", "PATCH", "PUT"].includes(request.method)) {
				// 	request.headers["x-http-method-override"] = request.method;
				// 	request.headers[":method"] = "POST";
				// }
				// return headers[":authority"];
			},
		},
	});

	// Proxy for webhooks with custom options
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_WEBHOOKS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_WEBHOOKS_PATH}/`, // Fix trailing slash, make condidional on empty /
		logLevel: "trace",
		preHandler: async (request, reply) => {
			// Access the Host and Origin headers from the original request
			fastify.log.info('PREHANDLER WEBHOOKS');
			printRequest(request, fastify);
		},
		replyOptions: {
			rewriteRequestHeaders: (request, headers) => {
				fastify.log.info('REWRITE WEBHOOKS');
				fastify.log.info('Original Headers:', {...headers});
				return headers
			}
		}
	});
});

function printRequest(request: FastifyRequest, fastify: FastifyInstance) {
	// Access the Host and Origin headers from the original request
	fastify.log.info(`Request URL: ${request.url}`);
	fastify.log.info(`Request IP: ${request.ip}`);
	fastify.log.info(`Request IPs: ${request.ips}`);
	fastify.log.info(`Request Headers: ${request.headers["authority"]}`);
	fastify.log.info(`Request Host: ${request.headers["host"]}`);
	fastify.log.info(`Request Origin: ${request.headers["origin"]}`);
	fastify.log.info(`Request Referer: ${request.headers["referer"]}`);
	fastify.log.info(
		`Request X-Forwarded-For: ${request.headers["x-forwarded-for"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Host: ${request.headers["x-forwarded-host"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Origin: ${request.headers["x-forwarded-origin"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Proto: ${request.headers["x-real-ip"]}`
	);
	fastify.log.info(`Request From: ${request.headers["from"]}`);
	fastify.log.info(`Request User-Agent: ${request.headers["user-agent"]}`);
	fastify.log.info(`Request Forwarded: ${request.headers["forwarded"]}`);
	fastify.log.info(
		`Request X-Forwarded-Proto: ${request.headers["x-forwarded-proto"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Port: ${request.headers["x-forwarded-port"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Scheme: ${request.headers["x-forwarded-scheme"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-User: ${request.headers["x-forwarded-user"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Method: ${request.headers["x-forwarded-method"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Uri: ${request.headers["x-forwarded-uri"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Ssl: ${request.headers["x-forwarded-ssl"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Server: ${request.headers["x-forwarded-server"]}`
	);
	fastify.log.info(
		`Request X-Forwarded-Scheme: ${request.headers["x-forwarded-scheme"]}`
	);
	fastify.log.info(`Request Connection: ${request.headers["connection"]}`);
	fastify.log.info(`Request Range: ${request.headers["range"]}`);
}
