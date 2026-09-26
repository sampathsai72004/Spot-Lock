import os
from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "spotlock",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
)

celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
)

import backend.tasks.monthly_report

celery_app.conf.beat_schedule = {
    "monthly-user-reports": {
        "task": "backend.tasks.monthly_report.schedule_all_reports", 
        "schedule": crontab(hour=0, minute=0, day_of_month=1),

    },
}
