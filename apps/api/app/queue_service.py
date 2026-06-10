import redis
from rq import Queue
from app.config import settings

_redis_conn = None

def get_redis_connection():
    global _redis_conn
    if _redis_conn is None:
        _redis_conn = redis.from_url(settings.REDIS_URL)
    return _redis_conn

def get_queue(name="ai_review_queue"):
    return Queue(name, connection=get_redis_connection())
