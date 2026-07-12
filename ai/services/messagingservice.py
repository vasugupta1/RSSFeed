from pika.adapters.blocking_connection import BlockingChannel
from pika.exceptions import AMQPConnectionError, AMQPChannelError
import pika
import json
from typing import Any


class VectorEmbeddingMessanger:
    def __init__(self, uri: str):
        self.uri = uri

    def __create_channel__(self) -> BlockingChannel:
        params = pika.URLParameters(self.uri)
        connection = pika.BlockingConnection(params)
        channel = connection.channel() 
        channel.queue_declare(queue='rss_tasks', durable=True)
        return channel

    def can_connect(self) -> bool:
        channel: BlockingChannel | None = None
        try:
            channel = self.__create_channel__()
            return True

        except (AMQPConnectionError, AMQPChannelError) as e:
            print(f"RabbitMQ Health Check Failed: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error during RabbitMQ health check: {e}")
            return False
        finally:
            if channel and channel.is_open:
                channel.close()

    def publish(self, message_body: Any) -> bool:
        channel: BlockingChannel | None = None
        try:
            channel = self.__create_channel__()
            serialized_data = json.dumps(message_body).encode('utf-8')
            channel.basic_publish(
                exchange='',
                routing_key='rss_tasks',
                body=serialized_data,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            print(f"Successfully published message: {message_body}")
            return True

        except (AMQPConnectionError, AMQPChannelError) as e:
            print(f"RabbitMQ Health Check Failed: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error during RabbitMQ health check: {e}")
            return False
        finally:
            if channel and channel.is_open:
                channel.close()

