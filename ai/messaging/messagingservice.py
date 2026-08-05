from pika.adapters.blocking_connection import BlockingChannel
from pika.exceptions import AMQPConnectionError, AMQPChannelError
import pika
import json
from typing import Any, Callable
from pika.spec import Basic 
from pika.spec import BasicProperties
from pika import BlockingConnection


class MessagingService:
    def __init__(self, uri: str, queue_name: str | None, exchange_name:str | None):
        self.uri = uri
        self.queue_name = queue_name
        self.exchange_name = exchange_name

    def __create__(self) -> tuple[BlockingConnection, BlockingChannel]:
        params = pika.URLParameters(self.uri)
        connection = pika.BlockingConnection(params)
        channel = connection.channel() 
        return connection,channel

    def can_connect(self) -> bool:
        channel: BlockingChannel | None = None
        connection: BlockingConnection | None = None
        try:
            connection, channel = self.__create__()
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
            if connection and connection.is_open:
                connection.close()


    def publish_to_exchange(self, message_body: Any) -> bool:
            if not self.exchange_name:
                raise TypeError("exchange name cannot be empty or None")
            
            channel: BlockingChannel | None = None
            connection: BlockingConnection | None = None
            try:
                connection, channel = self.__create__()
                serialized_data = json.dumps(message_body).encode('utf-8')
                channel.basic_publish(
                    exchange=self.exchange_name,
                    routing_key="",
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
                if connection and connection.is_open:
                    connection.close()


    def publish_to_queue(self, message_body: Any) -> bool:
        if not self.queue_name:
            raise TypeError("queue namecannot be empty or None")

        channel: BlockingChannel | None = None
        connection: BlockingConnection | None = None
        try:
            connection, channel = self.__create__()
            serialized_data = json.dumps(message_body).encode('utf-8')
            channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
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
            if connection and connection.is_open:
                connection.close()

    def comsume(self, callback: Callable[[Any], None]) -> None:
        if not self.queue_name:
            raise TypeError("queue namecannot be empty or None")
        
        channel: BlockingChannel | None = None
        connection: BlockingConnection | None = None
        try:
            connection, channel = self.__create__()
            def pika_callback(ch: BlockingChannel, method: Basic.Deliver, properties: BasicProperties, body: bytes) -> None:
                try:
                    obj = json.loads(body.decode("utf-8"))
                    callback(obj)
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                except Exception as eval_error:
                    print(f"Error processing message: {eval_error}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=self.queue_name, on_message_callback=pika_callback)
            channel.start_consuming()

           
        except KeyboardInterrupt:
            if channel and channel.is_open:
                channel.stop_consuming()

        except (AMQPConnectionError, AMQPChannelError) as e:
            print(f"RabbitMQ Health Check Failed: {e}")
        
        except Exception as e:
            print(f"Unexpected error during RabbitMQ health check: {e}")

        finally:
            if channel and channel.is_open:
                channel.close()
            if connection and connection.is_open:
                connection.close()