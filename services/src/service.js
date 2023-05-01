// // ./services/dogs/index.js

// const express = require('express');
// const axios = require('axios');
// const opentracing = require('opentracing');

// const { createTracer } = require('./tracer.js');

// const tracer = createTracer(
//   'dogs-service',
//   'http://collector:14268/api/traces'
// );

// const app = express();

// app.use('/', async (req, res) => {
//   const parent = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
//   const span = tracer.startSpan('dogs.process-request', { childOf: parent });
//   const id = req.query.id;
//   span.setTag('dogs.id', id);

//   const name = await getDogName(id, span);
//   res.send(name);
//   span.finish();
// });

// app.listen('8080', '0.0.0.0');

// async function getDogName(id, parent) {
//   const names = ['Rufus', 'Rex', 'Dobby', 'Möhre', 'Jack', 'Charlie'];

//   const span = tracer.startSpan('inventory.get-dog-name', {
//     childOf: parent,
//   });
//   await new Promise((resolve) => setTimeout(resolve, 100));
//   span.finish();
//   return names[id];
// }
const express = require('express');
const CLSContext = require('zipkin-context-cls');
const {Tracer} = require('zipkin');
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
const {recorder} = require('./recorder');


const ctxImpl = new CLSContext('zipkin');
const localServiceName = 'service';
const tracer = new Tracer({ctxImpl, recorder: recorder(localServiceName), localServiceName});

const app = express();

// instrument the server

app.use(zipkinMiddleware({tracer}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', [
    'Origin', 'Accept', 'X-Requested-With', 'X-B3-TraceId',
    'X-B3-ParentSpanId', 'X-B3-SpanId', 'X-B3-Sampled'
  ].join(', '));
  next();
});

// eslint-disable-next-line no-unused-vars
function sleep(milliseconds) {
  const start = new Date().getTime();
  for (let i = 0; i < 1e10; i += 1) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

app.get('/api', (req, res) => {
  // sleep(1500);
  res.send(`API - ${new Date().toString()}`);
});

app.get('/api/v2', (req, res) => {
  // sleep(1500);
  // res.status(404).send('Not found');
  res.send(`API V2 - ${new Date().toString()}`);
});

app.listen(9000, () => {
  console.log('Backend listening on port 9000!');
});
