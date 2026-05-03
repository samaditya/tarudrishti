import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging

from database import SessionLocal
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_email(subject, html_content):
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")
    receiver_email = os.getenv("NOTIFICATION_EMAIL")

    # If credentials are not set, mock the email to the console
    if not sender_email or not sender_password or not receiver_email:
        logger.warning("Email credentials not fully set. Mocking email output to console:")
        print("\n" + "="*60)
        print(f"📧 MOCKED EMAIL TO: {receiver_email or '[NOTIFICATION_EMAIL not set]'}")
        print(f"🏷️ SUBJECT: {subject}")
        print(html_content)
        print("="*60 + "\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Tarudrishti Botanical Assistant <{sender_email}>"
        msg["To"] = receiver_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Assuming Gmail SMTP for this example
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        logger.info(f"Notification email sent successfully to {receiver_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

def check_and_send_daily_notifications():
    logger.info("Running daily notification check...")
    db = SessionLocal()
    
    try:
        plants = db.query(models.Plant).all()
        now = datetime.now()
        today_date = now.date()

        tasks_due_today = []

        for plant in plants:
            logs = plant.care_logs
            
            # Check Watering (Interval: 7 days)
            water_logs = [log for log in logs if 'water' in log.action_type.lower()]
            water_logs.sort(key=lambda x: x.action_date, reverse=True)
            last_water = water_logs[0].action_date.date() if water_logs else None
            
            if last_water:
                next_water = last_water + timedelta(days=7)
                if next_water <= today_date:
                    tasks_due_today.append(f"💧 <b>Water</b> {plant.name} ({plant.species})")
            else:
                tasks_due_today.append(f"💧 <b>Water</b> {plant.name} (No previous log)")

            # Check Fertilizing/Substance (Interval: 30 days)
            fert_logs = [log for log in logs if 'fertilize' in log.action_type.lower() or log.substance_used]
            fert_logs.sort(key=lambda x: x.action_date, reverse=True)
            last_fert = fert_logs[0].action_date.date() if fert_logs else None
            last_substance = fert_logs[0].substance_used if fert_logs and fert_logs[0].substance_used else 'Fertilizer'

            if last_fert:
                next_fert = last_fert + timedelta(days=30)
                if next_fert <= today_date:
                    tasks_due_today.append(f"🌿 <b>{last_substance}</b> {plant.name} ({plant.species})")
            else:
                 tasks_due_today.append(f"🌿 <b>Fertilize</b> {plant.name} (No previous log)")

        if tasks_due_today:
            # Send Email
            subject = f"🌱 Tarudrishti: {len(tasks_due_today)} Tasks Due Today"
            
            html_content = f"""
            <html>
                <body style="font-family: 'Helvetica Neue', sans-serif; color: #222; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f4fdf4; padding: 20px; border-radius: 16px; border: 1px solid #dcf5df;">
                        <h2 style="color: #34C759; margin-top: 0; font-size: 24px;">Your Daily Garden Schedule</h2>
                        <p style="font-size: 16px;">Good morning! Here are the care tasks due for your plants today:</p>
                        
                        <ul style="list-style-type: none; padding-left: 0; margin-top: 20px;">
                            {"".join(f'<li style="padding: 12px 16px; background: white; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-size: 15px;">{task}</li>' for task in tasks_due_today)}
                        </ul>
                        
                        <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                            Generated autonomously by <b>Tarudrishti Botanical AI</b>
                        </p>
                    </div>
                </body>
            </html>
            """
            send_email(subject, html_content)
        else:
            logger.info("No tasks due today. Email skipped.")
    
    except Exception as e:
        logger.error(f"Error compiling notifications: {e}")
    finally:
        db.close()
