# RoadPay AI - Next.js Frontend Application

This directory contains the Next.js React frontend for the RoadPay AI Digital Challan Safety System.

For the comprehensive full-stack setup, requirements, architecture, and variable details, please refer to the main repository README:
👉 **[Main Repository README](file:///d:/Projects/README.md)**

---

## 1. Salient Features (Frontend)
*   **Modern Premium Dashboard**: A clean Apple-inspired layout supporting light mode and graphite dark mode.
*   **Responsive Flow Layouts**: Optimized screens for administrators, traffic officers (evidence upload & Gemini triggers), and citizens (safety education, quiz testing, checkout).
*   **Framer Motion Transitions**: Sleek micro-animations, loading states, and card modals.
*   **Recharts Dashboard Graphs**: Rich visual analytics showing ticket trends, paid status percentages, and user quiz metrics.

---

## 2. Compile & Setup Instructions

### Prerequisites
*   Node.js v18.x or v20.x
*   Running RoadPay API Backend (FastAPI on port 8000)

### Installation
1.  Install packages:
    ```bash
    npm install
    ```
2.  Set environment variables:
    ```bash
    copy .env.local.example .env.local
    ```
    Configure the backend endpoint path mapping (default: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`).

### Running the Application
*   **Development Compiler**: Run the hot-reloading development server:
    ```bash
    npm run dev
    ```
*   **Production Compilation**: Generate an optimized build ready for hosting:
    ```bash
    npm run build
    ```
*   **Start Build Server**: Launch the built production server locally:
    ```bash
    npm start
    ```
