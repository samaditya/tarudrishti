import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import mailer

logger = logging.getLogger(__name__)

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every day at 8 AM, aligning with the existing mailer logic
    scheduler.add_job(mailer.check_and_send_daily_notifications, CronTrigger(hour=8, minute=0))
    scheduler.start()
    logger.info("APScheduler started.")
