import asyncio
import logging
import signal
from config.appconfiguration import AppConfiguration
from factories.servicefactory import WorkerServiceContainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    config = AppConfiguration()  # type: ignore[reportCallIssue]
    container = await WorkerServiceContainer.build(config)

    tasks: list[asyncio.Task] = []

    if container.crawl_ontology_event_consumer:
        task = asyncio.create_task(
            container.crawl_ontology_event_consumer.run_consumer()
        )
        tasks.append(task)

    if not tasks:
        logger.error("No consumers were started. Exiting.")
        return

    logger.info("Ontology worker started with %d consumer(s)", len(tasks))

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
    logger.info("Ontology worker shut down cleanly.")


if __name__ == "__main__":
    asyncio.run(main())
