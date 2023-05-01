// const {
//   BasicTracerProvider,
//   ConsoleSpanExporter,
//   SimpleSpanProcessor,
// } = require('@opentelemetry/tracing');
// const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-http');
// const {Resource} = require('@opentelemetry/resources');
// const {
//   SemanticResourceAttributes,
// } = require('@opentelemetry/semantic-conventions');

// const opentelemetry = require('@opentelemetry/sdk-node');
// const {
//   getNodeAutoInstrumentations,
// } = require('@opentelemetry/auto-instrumentations-node');


// const exporter = new OTLPTraceExporter({
//   url: 'http://localhost:4317/v1/traces'
// });

// const provider = new BasicTracerProvider({
//   resource: new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]:
//           'YOUR-SERVICE-NAME',
//   }),
// });
// // export spans to console (useful for debugging)
// provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
// // export spans to opentelemetry collector
// provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// provider.register();
// const sdk = new opentelemetry.NodeSDK({
//   traceExporter: exporter,
//   instrumentations: [getNodeAutoInstrumentations()],
// });

// sdk
//   .start()
//   .then(() => {
//     console.log('Tracing initialized');
//   })
//   .catch(error => console.log('Error initializing tracing', error));

// process.on('SIGTERM', () => {
//   sdk
//     .shutdown()
//     .then(() => console.log('Tracing terminated'))
//     .catch(error => console.log('Error terminating tracing', error))
//     .finally(() => process.exit(0));
// });


// tracing.js

// OpenTelemetry
const {Resource} = require('@opentelemetry/resources');
const {SemanticResourceAttributes} = require('@opentelemetry/semantic-conventions');
// const {ConsoleSpanExporter, SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {ZipkinExporter} = require('@opentelemetry/exporter-zipkin');

const {NodeTracerProvider} = require('@opentelemetry/sdk-trace-node');
const {trace} = require('@opentelemetry/api');
// instrumentations
const {ExpressInstrumentation} = require('opentelemetry-instrumentation-express');
const {HttpInstrumentation} = require('@opentelemetry/instrumentation-http');
const {registerInstrumentations} = require('@opentelemetry/instrumentation');

// Exporter
module.exports = (serviceName) => {
  // const exporter = new ConsoleSpanExporter();
  const options = {
    // headers: {
    //   'my-header': 'header-value',
    // },
    url: 'http://localhost:4317/v1/traces',
    // optional interceptor
    // getExportRequestHeaders: () => ({
    //   'my-header': 'header-value',
    // })
  };
  // eslint-disable-next-line no-unused-vars
  const exporter = new ZipkinExporter(options);

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  // provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
    tracerProvider: provider,
  });
  return trace.getTracer(serviceName);
};
