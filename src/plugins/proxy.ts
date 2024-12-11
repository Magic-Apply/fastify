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

const primaryClientDomain = isProduction
	? String(process.env.PRIMARY_CLIENT_DOMAIN)
	: String(process.env.PRIMARY_CLIENT_DOMAIN_LOCAL);

const logLevel = isProduction ? "info" : "trace";

export default fp(async (fastify) => {
	await fastify.register(fastifyIp, {
		order: ["x-forwarded-for", "x-real-ip"],
		strict: false,
		isAWS: false,
	});
	// Proxy for operations with error handling
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_OPERATIONS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_OPERATIONS_PATH}/`, // Fix trailing slash, make condidional on empty /
		logLevel: logLevel,
		httpMethods: ["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"],
		preValidation: async (request, reply) => {
			fastify.log.info("PREVALIDATION OPERATIONS REQUEST");

			// TODO: Add IP Whitelisting
			// if (!ip) {
				// 	reply.status(403).send({ error: "Forbidden" });
				// 	return;
				// }
				
			// Redirect to favicon
			if (request.url === "/favicon.ico") {
				fastify.log.info("REDIRECTING TO FAVICON");
				reply.redirect("/assets/favicon.ico");
				return;
			}
			

		},
		preHandler: async (request, reply) => {
			fastify.log.info("PREHANDLER OPERATIONS REQUEST");
			printRequest(request, fastify);
				
			// If method is DELETE, PATCH, or PUT, rewrite to POST
			const method = request.method;
			if (["DELETE", "PATCH", "PUT"].includes(method)) {
				request.headers['x-http-method-override'] = request.method;
				request.raw.method = 'POST';
			}
		},
		replyOptions: {
			rewriteRequestHeaders: (request, originalHeaders) => {
				fastify.log.info("REWRITE OPERATIONS REQUEST");

				// Modify request headers (before sending to internal api)
				return {
					...originalHeaders,
					host: internalAPIHost, // Ensure the host is fixed to the internal api gateway
				};
			},
			rewriteHeaders: (headers, response) => {
				fastify.log.info("REWRITE OPERATIONS RESPONSE");

				// Modify response headers (before sending to client)
				return {
					...headers,
					"access-control-allow-origin":
						headers["access-control-allow-origin"] ??
						primaryClientDomain, // If no access-control-allow-origin, use the primary client domain to ensure CORS is active by default
				};
			},
		},
	});

	// Proxy for webhooks with custom options
	await fastify.register(httpProxy, {
		upstream: upstreamUrl,
		prefix: `/${process.env.PUBLIC_API_WEBHOOKS_PATH}`,
		rewritePrefix: `/${process.env.INTERNAL_API_WEBHOOKS_PATH}/`, // Fix trailing slash, make condidional on empty /
		logLevel: logLevel,
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
					"access-control-allow-origin":
						headers["access-control-allow-origin"] ??
						primaryClientDomain, // If no access-control-allow-origin, use the primary client domain to ensure CORS is active by default
				};
			},
		},
	});
});

function printRequest(request: FastifyRequest, fastify: FastifyInstance) {
	// Access the Host and Origin headers from the original request
	const logData = {
		requestUrl: request.url,
		requestIp: request.ip,
		requestIps: request.ips,
		requestHeaders: {
			authority: request.headers["authority"],
			host: request.headers["host"],
			origin: request.headers["origin"],
			referer: request.headers["referer"],
			xForwardedFor: request.headers["x-forwarded-for"],
			xForwardedHost: request.headers["x-forwarded-host"],
			xForwardedOrigin: request.headers["x-forwarded-origin"],
			xRealIp: request.headers["x-real-ip"],
			from: request.headers["from"],
			userAgent: request.headers["user-agent"],
			forwarded: request.headers["forwarded"],
			xForwardedProto: request.headers["x-forwarded-proto"],
			xForwardedPort: request.headers["x-forwarded-port"],
			xForwardedScheme: request.headers["x-forwarded-scheme"],
			xForwardedUser: request.headers["x-forwarded-user"],
			xForwardedMethod: request.headers["x-forwarded-method"],
			xForwardedUri: request.headers["x-forwarded-uri"],
			xForwardedSsl: request.headers["x-forwarded-ssl"],
			xForwardedServer: request.headers["x-forwarded-server"],
			connection: request.headers["connection"],
			range: request.headers["range"],
		},
	};

	fastify.log.info(logData);
}
