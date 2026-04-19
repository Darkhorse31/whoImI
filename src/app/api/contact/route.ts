import { NextRequest, NextResponse } from "next/server";
import mailchimp from "@mailchimp/mailchimp_transactional";

const client = mailchimp(process.env.MAILCHIMP_TRANSACTIONAL_API_KEY ?? "");

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!process.env.MAILCHIMP_TRANSACTIONAL_API_KEY) {
      return NextResponse.json({ error: "Mail service is not configured." }, { status: 500 });
    }

    const recipient = process.env.RECIPIENT_EMAIL ?? "prateek.devfullstack@gmail.com";

    await client.messages.send({
      message: {
        from_email: process.env.MAILCHIMP_FROM_EMAIL ?? recipient,
        from_name: "Portfolio Contact",
        to: [{ email: recipient, type: "to" }],
        subject: `[Portfolio Contact] ${subject}`,
        html: `
          <h2>New message from your portfolio</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr />
          <p style="white-space:pre-wrap">${message}</p>
        `.trim(),
        headers: { "Reply-To": email },
      },
      
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
