export class NotificationService {
  public static sendEmail(toEmail: string, subject: string, body: string) {
    console.log("==========================================");
    console.log(`EMAIL SENT TO: ${toEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${body}`);
    console.log("==========================================");
  }

  public static notifyOrderStatusChange(email: string, orderId: string, newStatus: string, detailUrl: string) {
    const subject = `Order #${orderId.slice(-8)} Status Update - CreackEduHelp`;
    const body = `Hello,

Your order status has been updated to: ${newStatus}.

Please visit your dashboard to review updates or respond to your specialists:
${detailUrl}

Thank you,
The CreackEduHelp Operations Team
`;
    NotificationService.sendEmail(email, subject, body);
  }

  public static notifyNewQuote(email: string, orderId: string, amount: number, detailUrl: string) {
    const subject = `Quote issued for Order #${orderId.slice(-8)} - CreackEduHelp`;
    const body = `Hello,

Our academic specialists have reviewed your request and issued a quotation of £${amount.toFixed(2)}.

To initiate the project, please pay the 30% deposit of £${(amount * 0.3).toFixed(2)} using the bank details on the platform:
${detailUrl}

Thank you,
CreackEduHelp Billing Support
`;
    NotificationService.sendEmail(email, subject, body);
  }

  public static notifyPaymentReceived(email: string, orderId: string, amount: number, paymentType: string) {
    const subject = `Payment Confirmation: £${amount.toFixed(2)} - CreackEduHelp`;
    const body = `Hello,

We have verified your manual payment of £${amount.toFixed(2)} for your order.
Payment Type: ${paymentType}

Your order status has been updated accordingly.

Thank you,
CreackEduHelp Accounts Department
`;
    NotificationService.sendEmail(email, subject, body);
  }
}
export default NotificationService;
