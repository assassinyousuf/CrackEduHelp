import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CreackEduHelpNotifications")


class NotificationService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        """Mock email dispatch by logging the parameters."""
        logger.info("==========================================")
        logger.info(f"EMAIL SENT TO: {to_email}")
        logger.info(f"SUBJECT: {subject}")
        logger.info(f"BODY:\n{body}")
        logger.info("==========================================")

    @staticmethod
    def notify_order_status_change(email: str, order_id: str, new_status: str, detail_url: str):
        subject = f"Order #{order_id[-8:]} Status Update - CreackEduHelp"
        body = f"""Hello,

Your order status has been updated to: {new_status}.

Please visit your dashboard to review updates or respond to your specialists:
{detail_url}

Thank you,
The CreackEduHelp Operations Team
"""
        NotificationService.send_email(email, subject, body)

    @staticmethod
    def notify_new_quote(email: str, order_id: str, amount: float, detail_url: str):
        subject = f"Quote issued for Order #{order_id[-8:]} - CreackEduHelp"
        body = f"""Hello,

Our academic specialists have reviewed your request and issued a quotation of £{amount:.2f}.

To initiate the project, please pay the 30% deposit of £{amount*0.3:.2f} using the bank details on the platform:
{detail_url}

Thank you,
CreackEduHelp Billing Support
"""
        NotificationService.send_email(email, subject, body)

    @staticmethod
    def notify_payment_received(email: str, order_id: str, amount: float, payment_type: str):
        subject = f"Payment Confirmation: £{amount:.2f} - CreackEduHelp"
        body = f"""Hello,

We have verified your manual payment of £{amount:.2f} for your order.
Payment Type: {payment_type}

Your order status has been updated accordingly.

Thank you,
CreackEduHelp Accounts Department
"""
        NotificationService.send_email(email, subject, body)
