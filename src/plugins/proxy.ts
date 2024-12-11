// plugins/proxy.ts
import fp from "fastify-plugin";
import httpProxy from "@fastify/http-proxy";
import { FastifyRequest, FastifyInstance } from "fastify";
import fastifyIp from "fastify-ip";
const isProduction =
	!process.env.RUN_LOCAL || process.env.RUN_LOCAL === "false";
const upstreamUrl = isProduction
	? String(process.env.INTERNAL_API_BASE_URL)
	: String(process.env.INTERNAL_API_BASE_URL_LOCAL);

const internalAPIHost = isProduction
	? String(process.env.INTERNAL_API_HOST)
	: String(process.env.INTERNAL_API_HOST_LOCAL);

export default fp(async (fastify) => {
	await fastify.register(fastifyIp, {
		order: ['x-forwarded-for', 'x-real-ip'],
		strict: false,
		isAWS: false
	});
	// Proxy for operations with error handling
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_OPERATIONS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_OPERATIONS_PATH}/`, // Fix trailing slash, make condidional on empty /
		logLevel: "trace",
		disableCache: true,
		preHandler: async (request, reply) => {
			fastify.log.info("PREHANDLER OPERATIONS REQUEST");
			if (request.url === "/favicon.ico") {
				fastify.log.info("REDIRECTING TO FAVICON");
				reply.redirect("/assets/favicon.ico");
				return;
			}
			printRequest(request, fastify);
			// IP Whitelisting
			// if (!ip) {
			// 	reply.status(403).send({ error: "Forbidden" });
			// 	return;
			// }

		},
		replyOptions: {
			rewriteRequestHeaders: (request, originalHeaders) => {
				fastify.log.info("REWRITE OPERATIONS REQUEST");
				fastify.log.info('Request IP', request.ip);
				fastify.log.info('Request IPs', request.ips);

				// If method is DELETE or PATCH, rewrite to POST
				const method = originalHeaders[":method"] as string;
				if (["DELETE", "PATCH", "PUT"].includes(method)) {
					originalHeaders["x-http-method-override"] = method;
					originalHeaders[":method"] = "POST";
				}

				// Return modified headers
				return {
					...originalHeaders,
					host: internalAPIHost,
				};
			},
			rewriteHeaders: (headers, response) => {
				
				// Currently does nothing
				// fastify.log.info("REWRITE OPERATIONS RESPONSE");
				return {
					...headers,
					// 'access-control-allow-origin': 'http://127.0.0.1:4000', // If you want to play with CORS, this is the header to change
				};
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
			fastify.log.info("PREHANDLER WEBHOOKS REQUEST");
			printRequest(request, fastify);
			// IP Whitelisting
			// if (!ip) {
			// 	reply.status(403).send({ error: "Forbidden" });
			// 	return;
			// }
		},
		replyOptions: {
			rewriteRequestHeaders: (request, originalHeaders) => {
				fastify.log.info("REWRITE WEBHOOKS REQUEST");
				// Return modified headers
				return {
					...originalHeaders,
					host: internalAPIHost, // Ensure the host is fixed to the internal api gateway
				};
			},
			rewriteHeaders: (headers, response) => {
				// Currently does nothing
				// fastify.log.info("REWRITE WEBHOOKS RESPONSE");
				return {
					...headers,
					// 'access-control-allow-origin': 'http://127.0.0.1:4000', // If you want to play with CORS, this is the header to change
				};
			},
		},
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
