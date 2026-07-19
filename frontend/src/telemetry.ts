import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

export function initTelemetry() {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'rssfeed-frontend',
  });

  // Export spans to Aspire's OTLP endpoint.
  // In dev, Vite proxies /otlp → Aspire dashboard's OTLP HTTP receiver.
  const exporter = new OTLPTraceExporter({
    url: '/otlp/v1/traces',
  });

  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  // Auto-instrument all fetch() calls.
  // This injects the W3C `traceparent` header into outgoing requests,
  // which the Go BFF will extract to continue the trace.
  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        // Only trace our own API calls — ignore external RSS feed URLs
        ignoreUrls: [/^https?:\/\/(?!localhost)/],
        // Propagate trace headers on all same-origin requests
        propagateTraceHeaderCorsUrls: [/.*/],
        clearTimingResources: true,
      }),
    ],
  });
}
