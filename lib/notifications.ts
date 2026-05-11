import { prisma } from "./prisma";
import { getResend, FROM_EMAIL } from "./resend";
import { getEmailTemplate, TemplateData } from "./email-templates";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: TemplateData;
  sendEmail?: boolean;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
  sendEmail = true,
}: CreateNotificationParams) {
  // Save to DB
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: type as never,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    },
  });

  // Send email
  if (sendEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        const resend = getResend();
        if (resend) {
          const templateData = { ...data, name: user.name };
          const { subject, html } = getEmailTemplate(type, templateData);

          await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject,
            html,
          });

          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        }
      }
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }
  }

  return notification;
}

// Notify multiple users
export async function notifyUsers(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  data?: TemplateData,
) {
  await Promise.allSettled(
    userIds.map((userId) =>
      createNotification({ userId, type, title, message, data })
    )
  );
}
