// plugins/methodOverride.ts
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.addHook('onRequest', (req, reply, done) => {
    // If method is DELETE or PATCH, rewrite to POST
    if (req.method === 'DELETE' || req.method === 'PATCH') {
      req.headers['x-http-method-override'] = req.method;
      req.raw.method = 'POST';
    }
    done();
  });
});
