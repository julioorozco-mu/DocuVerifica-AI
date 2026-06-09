import os
import redis
from rq import SimpleWorker as Worker
from rq import Queue
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)

listen = ['ai_review_queue']
conn = redis.from_url(settings.REDIS_URL)

if __name__ == '__main__':
    # Usar SimpleWorker en lugar de Worker normal porque os.fork() no existe en Windows.
    # SimpleWorker ejecuta el trabajo en el mismo proceso síncronamente (ideal para concurrencia=1).
    worker = Worker(listen, connection=conn)
    logging.info("Iniciando Worker de RQ. Escuchando colas: %s", listen)
    worker.work()
