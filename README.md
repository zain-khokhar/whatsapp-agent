# WhatsApp Agent

A powerful, easy-to-use WhatsApp automation tool for developers and businesses. Integrate WhatsApp messaging into your workflows, automate responses, and enhance customer engagement with minimal effort.

## Features

- 🚀 **Seamless WhatsApp Integration**  
    Connect and automate WhatsApp messaging with robust APIs.

- 🤖 **Automated Responses**  
    Set up smart replies and chatbots to handle customer queries 24/7.

- 🔒 **Secure & Reliable**  
    Built with security best practices to keep your data safe.

- 📈 **Scalable Architecture**  
    Designed to handle projects of any size, from startups to enterprises.

## Getting Started

1. **Clone the repository**
     ```bash
     git clone https://github.com/yourusername/whatsapp-agent.git
     cd whatsapp-agent
     ```

2. **Install dependencies**
     ```bash
     npm install
     ```

3. **Configure your environment**  
     Edit `.env` with your WhatsApp credentials and settings.

4. **Run the agent**
     ```bash
     npm start
     ```

## Use Cases

- Customer support automation
- Bulk notifications and alerts
- Lead generation and follow-ups
- Appointment reminders

## Documentation

See the [Wiki](https://github.com/yourusername/whatsapp-agent/wiki) for detailed setup, API reference, and advanced usage.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---

**Keywords:** WhatsApp automation, WhatsApp API, chatbot, customer support, messaging, Node.js

## Scheduler for Recurring Handouts

This project includes a built-in scheduler that automatically resends handouts to chats (groups or users) on a configurable interval.

- The last-sent timestamp is stored in `src/data/handoutHistory.json` so it persists across restarts (no database required).
- The scheduler checks the persisted history and sends a handout again if at least 1 hour has passed since the previous send.
- The stored timestamps include an ISO timestamp and a localized string with AM/PM for human readability.
- The scheduler starts automatically when the WhatsApp client becomes ready; you can adjust the poll interval in `src/index.js` where `initAutoSend` is called.

This makes scheduled handout delivery resilient: the timer is based on real world time (not server uptime), so messages are sent exactly one hour after the previous send even if the server restarts in the interim.

Environment variables:

- `ENABLE_AUTO_SEND=false` to disable scheduled sends.
- `AUTO_SEND_INTERVAL_MS=<milliseconds>` to set the scheduler polling interval (default 60000 ms = 1 minute).
