import os
from celery.schedules import crontab
class Config:
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class LocalDevelopmentConfig(Config):
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "database.sqlite3")
    DEBUG = True
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_PASSWORD_SALT = 'abcdef'
    SECURITY_PASSWORD_SINGLE_HASH = True

    SECRET_KEY = 'abcdedef'
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authorization'
    SECURITY_TOKEN_AUTHENTICATION_KEY = 'Bearer'
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_MAX_AGE = 3600
    SECURITY_API_ENABLED_METHODS = ["token", "session"]
    
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']

    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'spotlock.noreply@gmail.com'
    MAIL_PASSWORD = 'fdzz umcu odfy gwnc'   
    MAIL_DEFAULT_SENDER = 'spotlock.noreply@gmail.com'

    CELERY_BEAT_SCHEDULE = {
        'monthly_report': {
            'task': 'backend.tasks.send_monthly_reports',
            'schedule': crontab(hour=8, minute=0, day_of_month='1'),
        },
    }