import Fastify from 'fastify';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { join } from 'path';

const fastify = Fastify({
  logger: true
});

const pluginOptions: Partial<AutoloadPluginOptions> = {
  // Place your custom options the autoload plugin below here.
}

const isProduction = !process.env.RUN_LOCAL || process.env.RUN_LOCAL === 'false';
const host = isProduction ? `${process.env.HOST}` : `${process.env.HOST_LOCAL}` || '::';
const port = isProduction ? Number(process.env.PORT) : Number(process.env.PORT_LOCAL) || 3000;

fastify.register(AutoLoad, {
  dir: join(__dirname, 'plugins'),
  options: pluginOptions
});

fastify.register(AutoLoad, {
  dir: join(__dirname, 'routes'),
  options: pluginOptions
});

fastify.listen({ host, port }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});