from flask_mail import Message
from backend.app import mail  

def send_email(to, subject, html_content):
    msg = Message(subject=subject, recipients=[to], html=html_content)
    mail.send(msg)
