// plugins/proxy.ts
import fp from 'fastify-plugin';
import httpProxy from '@fastify/http-proxy';

export default fp(async (fastify) => {
  await fastify.register(httpProxy, {
    upstream: 'http://localhost:9991/operations', // Replace with real URL
    replyOptions: {
      // Any customizations you need
    },
	prefix: '/api'
  });
});
