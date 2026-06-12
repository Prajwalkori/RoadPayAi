# RoadPay AI - Digital Challan Safety System

RoadPay AI is a production-ready, full-stack application designed to detect traffic violations automatically, generate digital challans, and replace pure punishment with gamified safety education. Offending vehicle owners can take interactive, AI-driven road safety quizzes to earn up to a 20% discount on their fine.

---

## 1. Salient Features of the Software

*   **Multimodal AI Detection & OCR**: Automated computer vision using Google Gemini 2.5 Flash to upload pictures/videos of infractions, extract license plates, match them to the registry database, and formulate a clear safety hazard explanation.
*   **Dynamic PDF Challan Compilation**: Generates professional PDF invoices using the ReportLab layout engine, embedding evidential screenshots, payment links, and dynamic scan-to-pay QR codes.
*   **Transactional Email Alerts**: Auto-templates and dispatches email alerts using SMTP to notify vehicle owners immediately when a infraction is logged, along with deadline warnings and payment reminders.
*   **Interactive Gamified Learning**: Allows citizens to study safety instructions and undertake AI-generated quizzes about their specific violation, encouraging knowledge retention.
*   **Mitigation Discount Engine**: Automatic penalty reductions where a score of 80%+ on safety quizzes grants a 10% discount, and 90%+ grants a 20% discount on the fine amount.
*   **Razorpay Secure Checkout**: Integrated with credit/debit card, net banking, and UPI checkout via the Razorpay API (with test-mode and local simulator fallback).
*   **Administrative Overrides**: Features a dedicated management dashboard allowing admin overrides for unassigned license plates, user registry CRUD management, API key configurations, and time-travel testing (calendar day progression).

---

## 2. Details of the Variables Used

The application operates on configuration parameters defined via Environment Variables, as well as database variables modeled using SQLAlchemy.

### A. Environment Configuration Variables
These variables should be set in `.env` inside the `backend/` directory, and `.env.local` inside the `frontend/` directory.

| Variable Name | Scope | Expected Format / Examples | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | `sqlite:///./roadpay.db` | Connection string for database (SQLite by default; PostgreSQL toggleable). |
| `JWT_SECRET_KEY` | Backend | Cryptographic hash string | Secret salt string utilized to sign and decode user login JWT tokens. |
| `GEMINI_API_KEY` | Backend | Google AI Studio Key | API credential for Google Gemini (OCR and safety analysis). |
| `SMTP_HOST` | Backend | `smtp.gmail.com` | Hostname of SMTP mailer server for email alerts. |
| `SMTP_PORT` | Backend | `587` | Connection port used by SMTP (TLS port 587 or SSL port 465). |
| `SMTP_USERNAME` | Backend | Email address | Username/sender email address for dispatching challan emails. |
| `SMTP_PASSWORD` | Backend | Custom app password | Password or application key associated with the SMTP username. |
| `RAZORPAY_KEY_ID` | Backend | `rzp_test_xxxxxx` | Client-facing public key ID supplied by Razorpay. |
| `RAZORPAY_SECRET` | Backend | Hash secret key | Private secret key credentials supplied by Razorpay. |
| `NEXT_PUBLIC_API_URL`| Frontend | `http://localhost:8000/api` | Target endpoint path of the FastAPI backend router engine. |

### B. Core Database Table Variables (Schemas)
These attributes map to SQLite database tables inside [models.py](file:///d:/Projects/backend/app/models.py):

#### 1. User Entity Variables (`users` table)
*   `id` (`Integer`): Unique auto-increment primary identifier.
*   `name` (`String`): User's full name.
*   `email` (`String`): Unique email address used for login.
*   `password_hash` (`String`): Securely hashed bcrypt password representation.
*   `role` (`String`): Access role levels. Supported values: `ADMIN`, `TRAFFIC_OFFICER`, `VEHICLE_OWNER`.
*   `status` (`String`): Account lifecycle indicator. Default: `ACTIVE`.
*   `created_at` (`DateTime`): Date and time of user account creation.

#### 2. Vehicle Registry Variables (`vehicles` table)
*   `id` (`Integer`): Unique auto-increment primary identifier.
*   `vehicle_number` (`String`): Standard uppercase alpha-numeric license plate format.
*   `owner_name` (`String`): First and last name of the registered legal owner.
*   `email` (`String`): Legal owner's registered email address (target for alerts).
*   `phone` (`String`): Owner's contact phone number.
*   `address` (`Text`): Owner's physical mailing address.
*   `vehicle_type` (`String`): Type category. Supported values: `MOTORCYCLE`, `CAR`, `TRUCK`.
*   `status` (`String`): Registry status (e.g. `ACTIVE`, `BLACKLISTED`).

#### 3. Violation Challan Variables (`violations` table)
*   `id` (`Integer`): Unique auto-increment primary identifier.
*   `challan_id` (`String`): Human-readable alphanumeric reference (`RP-YYYYMMDD-XXXX`).
*   `vehicle_number` (`String`): Associated license plate identifier.
*   `violation_type` (`String`): Infraction type. Supported values: `HELMET_VIOLATION`, `TRIPLE_RIDING`, `WRONG_DIRECTION`.
*   `violation_image_path` (`String`): Storage path linking to the evidence frame file.
*   `confidence_score` (`Float`): Decimal representing OCR extraction certainty.
*   `base_amount` (`Float`): Default standard penalty rate in currency units (e.g. ₹500.0).
*   `late_penalty` (`Float`): Cumulative penalty additions applied post-deadline.
*   `discount_earned` (`Float`): Reduction fraction earned via safety quizzes (0.0 to 0.20).
*   `final_amount` (`Float`): Net amount due after discount deductions and late additions.
*   `due_date` (`DateTime`): Deadline by which payment must be completed.
*   `status` (`String`): Lifecycle status of infraction. Supported values: `PENDING`, `PAID`, `OVERDUE`.
*   `explanation` (`Text`): Plain text generated by Gemini describing the safety issue.

#### 4. Payment Log Variables (`payments` table)
*   `id` (`Integer`): Unique auto-increment primary identifier.
*   `violation_id` (`Integer`): Foreign key matching the parent `violations.id`.
*   `payment_id` (`String`): Unique receipt transaction code from Razorpay.
*   `order_id` (`String`): Razorpay order identification code.
*   `amount` (`Float`): Absolute transaction value settled.
*   `payment_method` (`String`): Method utilized. Supported values: `UPI`, `CARD`, `NET_BANKING`.
*   `status` (`String`): Payment status. Supported values: `PENDING`, `SUCCESS`, `FAILED`.

#### 5. Quiz Activity Variables (`quiz_attempts` table)
*   `id` (`Integer`): Unique auto-increment primary identifier.
*   `user_id` (`Integer`): Foreign key referencing the testing citizen (`users.id`).
*   `violation_id` (`Integer`): Foreign key referencing the parent infraction (`violations.id`).
*   `score` (`Float`): Decimal score ratio representing performance (0.0 to 100.0).
*   `passed` (`Boolean`): Flag indicating if score meets or exceeds the minimum 80% mark.
*   `discount_earned` (`Float`): Percent fine discount earned (e.g. 0.10 or 0.20).
*   `answers` (`JSON`): Serialized question responses and feedback log database record.

---

## 3. System Requirements

### A. Minimum Hardware Requirements
*   **Processor (CPU)**: Dual-core 2.0 GHz processor or better.
*   **Memory (RAM)**: 8 GB RAM (16 GB RAM recommended for concurrently running Next.js development server and FastAPI server).
*   **Storage Space**: 2 GB free disk space (to house virtual environment packages, `node_modules`, database instances, and uploaded visual evidence).

### B. Software Requirements
*   **Operating System**: Windows 10/11, macOS 12+, or modern Linux distributions (e.g. Ubuntu 20.04+).
*   **Python Runtime**: Version `3.10` or `3.11`.
*   **Node.js Environment**: Version `18.x` or `20.x` (Long-Term Support recommended) with `npm` (v9+) package manager.
*   **Database Engine**: SQLite (default, self-contained file database `roadpay.db`). Alternatively, a PostgreSQL instance (v14+) can be linked.
*   **Web Browser**: Any modern browser supporting ECMAScript 6 (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge).
*   **Network Connectivity**: Standard internet connection is required to communicate with Google Gemini AI API services and Razorpay gateway servers.

---

## 4. Compilation & Execution Procedure

The project uses Next.js (TypeScript/React) for the frontend user interface, and FastAPI (Python) for the backend REST API engine. 

### A. Step-by-Step Backend Setup (FastAPI)

1.  **Open Console**: Launch a command-line interface (PowerShell/CMD on Windows or Terminal on Linux/macOS) in the `/backend` subdirectory:
    ```bash
    cd backend
    ```
2.  **Establish Virtual Environment**: Establish an isolated environment to prevent dependency package collisions:
    *   **Windows**:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   **macOS / Linux**:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
3.  **Install Libraries**: Compile and install requirements listed in [requirements.txt](file:///d:/Projects/backend/requirements.txt):
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure Environment**: Duplicate the configuration variables template:
    ```bash
    copy .env.example .env
    ```
    *(For Linux/macOS, use: `cp .env.example .env`)*. Open `.env` and fill in your credential values (e.g., `GEMINI_API_KEY`, `SMTP_HOST`).
5.  **Launch API Server**: Launch the Uvicorn engine to serve the REST API endpoints:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    *The SQLite database (`roadpay.db`) will compile automatically on initial boot, configuring schemas and seeding mock user roles (`admin@roadpay.ai`, `officer@roadpay.ai`, `owner@roadpay.ai`).*

### B. Step-by-Step Frontend Setup (Next.js)

1.  **Open Console**: Open a separate command terminal in the `/frontend` directory:
    ```bash
    cd frontend
    ```
2.  **Install Web Node Packages**: Run `npm install` to download, build, and link frontend packages defined in `package.json`:
    ```bash
    npm install
    ```
3.  **Configure Web Environment**: Copy the frontend network configuration:
    ```bash
    copy .env.local.example .env.local
    ```
    *(For Linux/macOS, use: `cp .env.local.example .env.local`)*. Verify that `NEXT_PUBLIC_API_URL` is pointed to the local backend address: `http://localhost:8000/api`.
4.  **Run Dev Compiler**: Initiate the hot-reloading Next.js dev server with Turbopack:
    ```bash
    npm run dev
    ```
    The frontend client will compile and serve on: `http://localhost:3000`.
5.  **Compile Production Bundle (Optional)**: To build a fully compiled, optimized, static export production bundle:
    ```bash
    npm run build
    ```

---

## 5. Public Domain & Third-Party Software Sheets

This software utilizes various public domain and open-source libraries to manage APIs, vision recognition models, PDF building, and visual graphics. 

A detailed, structured list containing **module names, version bounds, download sites, licenses, and specific functional purposes** is compiled on a separate sheet:
👉 **[Public Domain Software Sheet](file:///d:/Projects/PUBLIC_DOMAIN_SOFTWARE.md)**

---

## 6. Acknowledgments

We express our sincere appreciation to the developer communities and organizations who maintain the foundational open-source projects used in this software:
*   **Google AI**: For offering the Gemini multimodal vision model APIs for safety analysis.
*   **The FastAPI & Next.js Core Teams**: For building high-performance server-side and client-side framework architectures.
*   **The ReportLab Group**: For providing robust programmatic PDF canvas layout systems.
*   **Razorpay**: For rendering simplified merchant processing sandbox configurations.
*   **The Lucide project**: For supplying unified vector iconography.
*   All developers contributing to the ecosystem of open-source python packages and React npm modules detailed in the third-party list.
