import asyncio
import logging
import signal
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME

from config.appconfiguration import AppConfiguration
from factories.servicefactory import WorkerServiceContainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

def setup_telemetry(config: AppConfiguration):
    """Initialises OpenTelemetry metrics using configuration."""
    if not config.OTEL_EXPORTER_OTLP_ENDPOINT:
        logger.warning("No OTEL_EXPORTER_OTLP_ENDPOINT found in config. Metrics will not be exported.")
        return

    resource = Resource(attributes={SERVICE_NAME: config.OTEL_SERVICE_NAME})

    exporter = OTLPMetricExporter(
        endpoint=config.OTEL_EXPORTER_OTLP_ENDPOINT, 
        insecure=True
    ) 
    reader = PeriodicExportingMetricReader(exporter, export_interval_millis=5000)
    
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(provider)
    logger.info(f"OpenTelemetry metrics configured for service: {config.OTEL_SERVICE_NAME} at {config.OTEL_EXPORTER_OTLP_ENDPOINT}")


async def main():
    config = AppConfiguration()  # type: ignore[reportCallIssue]
    setup_telemetry(config)
    container = await WorkerServiceContainer.build(config)

    tasks: list[asyncio.Task] = []

    if container.crawl_research_event_consumer:
        task = asyncio.create_task(
            container.crawl_research_event_consumer.run_consumer()
        )
        tasks.append(task)

    if not tasks:
        logger.error("No consumers were started. Exiting.")
        return

    logger.info("Research worker started with %d consumer(s)", len(tasks))

    # Graceful shutdown on SIGTERM / SIGINT
    stop_event = asyncio.Event()
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, stop_event.set)

    await stop_event.wait()

    logger.info("Shutdown signal received. Cancelling consumers...")
    for task in tasks:
        task.cancel()

    await asyncio.gather(*tasks, return_exceptions=True)
    await container.cleanup()
    logger.info("Research worker shut down cleanly.")


if __name__ == "__main__":
    asyncio.run(main())
