# Module 02: AI Chat Concierge

### Module 02: AI Chat Concierge

**📌 PURPOSE**
- Provides high-net-worth clients with an automated, elegant virtual concierge to answer real estate questions and recommend luxury properties in real time.

**👥 USERS**
- **Client** (Prospective buyers and renters exploring the platform)
- **Guest / Visitor** (Public site visitors inquiring about estates)

**⚙️ KEY FEATURES**
- **Luxury Persona Guardrails**: Guides the AI to speak in an elegant, discreet, and architectural tone suited for multi-million dollar real estate.
- **Provider Fallback & Dynamic Routing**: Automatically connects to **Groq** or **xAI (Grok)** depending on configured API keys.
- **Multi-Turn Conversation**: Accepts a full conversation history (`messages` array) to maintain context across inquiries.
- **Broker Redirection**: Gently routes users to human private brokers when requests require verified legal or contract specifications.

**🔄 SIMPLE PROCESS**
- User Sends Message → Controller Validates Format → Service Calls AI Provider → AI Formats Response → Client Receives Reply

> **Realistic Example:**  
> A client types *"Do you have penthouses in BGC with private lap pools?"* into the chat modal. The **Controller** verifies the payload, passes it to the **Service** which attaches the luxury concierge prompt, calls Groq/xAI, and returns an elegant description directing them to Forbes Park and BGC penthouses.

**🚫 LIMITATIONS**
- **No Direct Database Writes**: The Chat module cannot alter property prices, book tours directly into the calendar, or change listing statuses.
- **Requires External AI Key**: Fails gracefully if neither `GROQ_API_KEY` nor `XAI_API_KEY` is defined in backend environment variables.
- **No Hallucination Liability**: System prompt instructs the AI not to invent unverified contract facts, directing users to real brokers instead.
