/* eslint-disable import/newline-after-import */
// initialize tracer
const axios = require('axios');
const express = require('express');
const CLSContext = require('zipkin-context-cls');
const {Tracer} = require('zipkin');
const zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;
const wrapAxios = require('zipkin-instrumentation-axiosjs');
const {recorder} = require('./recorder');

const ctxImpl = new CLSContext('zipkin');
const localServiceName = 'bff';
const tracer = new Tracer({ctxImpl, recorder: recorder(localServiceName), localServiceName});

const app = express();

// instrument the server

app.use(zipkinMiddleware({tracer}));

// instrument the client


const zipkinAxios = wrapAxios(axios, {tracer});

// Allow cross-origin, traced requests. See http://enable-cors.org/server_expressjs.html
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', [
    'Origin', 'Accept', 'X-Requested-With', 'X-B3-TraceId',
    'X-B3-ParentSpanId', 'X-B3-SpanId', 'X-B3-Sampled'
  ].join(', '));
  next();
});

app.get('/', (req, res) => {
  tracer.local('[GET]/api', () => {
    const r1 = zipkinAxios.get('http://localhost:9000/api');
    // .then(response => res.send(response.data))
    // .catch(err => console.error('Error', err.response ? err.response.status : err.message))

    const r2 = zipkinAxios.get('http://localhost:9000/api/v2');
    // .then(response => res.send(response.data))
    // .catch(err => console.error('Error', err.response ? err.response.status : err.message))

    Promise.all([r1, r2]).then((proms) => {
      // console.log('proms', proms)
      // response => res.send(response.data)
      const {data} = proms[0];
      return res.send(data);
    }).catch(err => res.send(err));

    // const span = tracer.startSpan('inventory.get-dog-name', {
    //   childOf: parent,
    // });
    // await new Promise((resolve) => setTimeout(resolve, 100));
    // span.finish();
  });
});

app.listen(8081, () => {
  console.log('Frontend listening on port 8081!');
});
