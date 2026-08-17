import asyncio
import json
from typing import Any, Callable, Awaitable
import aio_pika
from aio_pika.abc import AbstractRobustConnection, AbstractIncomingMessage


class AsyncMessagingService:
    def __init__(self, uri: str):
        self.uri = uri
        self._connection: AbstractRobustConnection | None = None

    @property
    def connection(self) -> AbstractRobustConnection:
        if self._connection is None or self._connection.is_closed:
            raise RuntimeError("RabbitMQ connection is not established. Call connect() first.")
        return self._connection

    async def connect(self) -> None:
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(self.uri)

    async def publish(self, routing_key: str, message_body: Any, exchange_name: str = "") -> None:
        await self.connect()
        
        # self.connection is guaranteed to be AbstractRobustConnection here
        async with self.connection.channel() as channel:
            exchange = (
                await channel.get_exchange(exchange_name)
                if exchange_name
                else channel.default_exchange
            )
            payload = json.dumps(message_body).encode("utf-8")
            await exchange.publish(
                aio_pika.Message(
                    body=payload,
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                ),
                routing_key=routing_key,
            )

    async def start_consumer(
        self,
        queue_name: str,
        callback: Callable[[Any], Awaitable[None] | None],
        prefetch_count: int = 10,
    ) -> None:
        """
        Creates a dedicated RobustChannel for this specific consumer task.
        Runs indefinitely until the connection closes or the task is cancelled.
        """
        if not self.connection or self.connection.is_closed:
            await self.connect()

        # Dedicated channel per consumer loop to isolate QoS and ACKs
        channel = await self.connection.channel()
        await channel.set_qos(prefetch_count=prefetch_count)

        queue = await channel.declare_queue(queue_name, durable=True)

        async def _on_message(message: AbstractIncomingMessage) -> None:
            async with message.process(requeue=False, reject_on_redelivered=False):
                try:
                    payload = json.loads(message.body.decode("utf-8"))
                    res = callback(payload)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception as e:
                    print(f"Error handling message from {queue_name}: {e}")
                    raise  # triggers nack without requeue via context manager

        await queue.consume(_on_message)
        print(f"[*] Consumer registered and listening on queue: {queue_name}")

    async def close(self) -> None:
        """Gracefully closes all channels and the shared connection."""
        self._closing = True
        if self.connection and not self.connection.is_closed:
            await self.connection.close()