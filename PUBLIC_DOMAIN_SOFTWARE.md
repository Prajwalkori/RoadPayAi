# Public Domain & Open Source Software Sheet

This document contains details of the public domain and open-source software libraries, frameworks, and modules utilized in **RoadPay AI**, along with their download sites/homepages, versions, and license details.

---

## 1. Backend Dependencies (Python Modules)

These modules are used by the FastAPI server engine for API routing, AI integration, PDF compilation, cryptography, and database management.

| Module Name | Version (Min) | Homepage / Download Site | License | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **fastapi** | `0.111.0` | [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/) | MIT | High-performance web framework for building APIs. |
| **uvicorn** | `0.30.0` | [https://www.uvicorn.org/](https://www.uvicorn.org/) | BSD 3-Clause | ASGI server implementation to run FastAPI. |
| **sqlalchemy** | `2.0.30` | [https://www.sqlalchemy.org/](https://www.sqlalchemy.org/) | MIT | SQL Toolkit and Object-Relational Mapper (ORM) for SQLite/PostgreSQL. |
| **pydantic** | `2.7.0` | [https://docs.pydantic.dev/](https://docs.pydantic.dev/) | MIT | Data validation and settings management using Python type annotations. |
| **python-jose[cryptography]** | `3.3.0` | [https://github.com/mpdavis/python-jose](https://github.com/mpdavis/python-jose) | MIT | JOSE (JSON Object Signing and Encryption) library for JWT auth tokens. |
| **passlib[bcrypt]** | `1.7.4` | [https://passlib.readthedocs.io/](https://passlib.readthedocs.io/) | BSD | Password hashing library for securing user credentials. |
| **python-multipart** | `0.0.9` | [https://github.com/Kludex/python-multipart](https://github.com/Kludex/python-multipart) | Apache 2.0 | Streaming multipart parser to support image/file uploads. |
| **google-genai** | `2.8.0` | [https://github.com/googleapis/python-genai](https://github.com/googleapis/python-genai) | Apache 2.0 | Google Gemini SDK for AI OCR and road safety hazard analysis. |
| **groq** | `1.4.0` | [https://github.com/groq/groq-python](https://github.com/groq/groq-python) | Apache 2.0 | Llama model inference engine SDK for backup vision model support. |
| **reportlab** | `4.2.0` | [https://www.reportlab.com/](https://www.reportlab.com/) | BSD | PDF generation library for compiling official traffic challans. |
| **qrcode** | `7.4.2` | [https://github.com/lincolnloop/python-qrcode](https://github.com/lincolnloop/python-qrcode) | BSD | QR Code generator for scan-to-pay functionality on challan PDFs. |
| **pillow** | `10.3.0` | [https://python-pillow.org/](https://python-pillow.org/) | HPND | Image processing library for manipulation of uploaded evidence. |
| **razorpay** | `1.3.0` | [https://github.com/razorpay/razorpay-python](https://github.com/razorpay/razorpay-python) | MIT | SDK for Razorpay payments platform checkout integration. |
| **httpx** | `0.27.0` | [https://www.python-httpx.org/](https://www.python-httpx.org/) | BSD 3-Clause | Fully featured HTTP client for making async network requests. |
| **bcrypt** | `4.0.1` | [https://github.com/pyca/bcrypt](https://github.com/pyca/bcrypt) | Apache 2.0 | Modern password hashing algorithm implementation. |
| **jinja2** | `3.1.4` | [https://jinja.palletsprojects.com/](https://jinja.palletsprojects.com/) | BSD 3-Clause | Modern and designer-friendly templating language for Python. |
| **email-validator** | `2.0.0` | [https://github.com/JoshData/python-email-validator](https://github.com/JoshData/python-email-validator) | CC0 1.0 | Robust email syntax validation library. |
| **anyio** | `4.0.0` | [https://github.com/agronholm/anyio](https://github.com/agronholm/anyio) | MIT | High-level asynchronous concurrency framework. |

---

## 2. Frontend Dependencies (NPM Packages)

These modules are used in the Next.js single-page application structure to provide a premium user interface, chart statistics, and smooth animations.

| Module Name | Version | Homepage / Download Site | License | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **next** | `16.2.9` | [https://nextjs.org/](https://nextjs.org/) | MIT | React framework for server-rendered apps, routing, and asset optimization. |
| **react** | `19.2.4` | [https://react.dev/](https://react.dev/) | MIT | Declarative, component-based user interface library. |
| **react-dom** | `19.2.4` | [https://react.dev/](https://react.dev/) | MIT | Entry point of the React DOM renderer. |
| **lucide-react** | `1.17.0` | [https://lucide.dev/](https://lucide.dev/) | ISC | Community-run fork of Feather Icons for clean vector glyphs. |
| **framer-motion** | `12.40.0` | [https://github.com/framer/motion](https://github.com/framer/motion) | MIT | Animation library for fluid transitions, gestures, and layout morphing. |
| **recharts** | `3.8.1` | [https://recharts.org/](https://recharts.org/) | MIT | Redefined chart library using React and D3 SVG elements. |
| **canvas-confetti** | `1.9.4` | [https://github.com/catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) | MIT | Confetti burst animations for quiz-passing screens. |
| **tailwindcss** | `4.0.x` | [https://tailwindcss.com/](https://tailwindcss.com/) | MIT | Utility-first CSS framework for rapid style drafting. |
| **typescript** | `5.x.x` | [https://www.typescriptlang.org/](https://www.typescriptlang.org/) | Apache 2.0 | Strongly typed programming language that builds on JavaScript. |
| **eslint** | `9.x.x` | [https://eslint.org/](https://eslint.org/) | MIT | Pluggable linting utility for identifying code syntax patterns. |
| **postcss** | `8.x.x` | [https://postcss.org/](https://postcss.org/) | MIT | Tool for transforming styles with JS plugins. |

---

## Acknowledgment

We express our sincere gratitude to the developers, maintainers, and community contributors of the above-listed open-source projects. Without their efforts in providing reliable, secure, and optimized code templates, libraries, and frameworks, building this comprehensive solution would not have been possible.
