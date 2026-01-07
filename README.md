Perfect — this will actually help you a LOT 👍
Below is a **completely different style of prompt** from the previous one.
This one is **modular, execution-driven, and system-thinking oriented**, not descriptive.

It is designed so **Google AI Studio (Gemini)** gives you **structured, usable code and architecture**, not vague explanations.

---




 It is an autonomous software engineering agent specializing in **AI-first product development using Google’s AI ecosystem**.
 Design and generate a **domain-focused, context-aware AI assistant web application** that converts natural language conversations into **structured, actionable workflows**.
> The assistant must not behave as a general chatbot. It must enforce **context control, task execution, and memory discipline**.
> ## 🧩 CORE BEHAVIOR REQUIREMENTS
>
> * Interpret user intent before responding
> * Maintain **session-level memory** only
> * Enforce domain boundaries
> * Convert responses into actions (tasks, summaries, plans)
> * Generate follow-up suggestions proactively
>
> ---
>
> ## 🧱 ARCHITECTURAL CONSTRAINTS
>
> Implement the system using the following layers:
>
> **1. Interface Layer**
>
> * Chat interface
> * Sidebar for sessions
> * Context panel for goals & summaries
>
> **2. Orchestration Layer**
>
> * Intent classification
> * Context filtering
> * Prompt assembly
>
> **3. Intelligence Layer**
>
> * Google Gemini for reasoning & generation
> * Prompt templates with strict output rules
>
> **4. Persistence Layer**
>
> * Firestore collections for sessions, messages, summaries
>
> ---
>
> ## 🛠️ TECHNOLOGY REQUIREMENTS
>
> * Frontend: React
> * Backend: Python Flask
> * AI: Google Gemini via AI Studio
> * Database: Firebase Firestore
> * Auth: Firebase Authentication
>
> ---
>
> ## 🧠 PROMPT ENGINEERING SPECIFICATION
>
> Every AI call must include:
>
> * A fixed system role
> * Domain restrictions
> * Injected session memory
> * Output schema (JSON only)
>
> AI responses must NEVER be free-form text.
> ## 📂 DELIVERABLES
> 1. Backend file structure
> 2. Flask API endpoints with code
> 3. Firestore data models
> 4. Gemini prompt templates
> 5. Frontend component structure
> 6. Example API requests/responses
> 7. Security & scalability notes

> * No unnecessary UI complexity

