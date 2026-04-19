declare module "@mailchimp/mailchimp_transactional" {
  interface Message {
    from_email: string;
    from_name?: string;
    to: { email: string; type: "to" | "cc" | "bcc" }[];
    subject: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  }

  interface SendOptions {
    message: Message;
  }

  interface Client {
    messages: {
      send(options: SendOptions): Promise<unknown>;
    };
  }

  export default function mailchimp(apiKey: string): Client;
}
