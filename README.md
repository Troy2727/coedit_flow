<div align="center">
  <br />
  <img src="https://github.com/user-attachments/assets/eaaeb1f0-22da-46be-9e29-9bef70e0039d" alt="Project Banner" width="600"/>
  <br />
  <br />
  <p>
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=61DAFB" alt="next.js" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
  </p>
  <h1 align="center">CoEdit Flow</h1>
  <p align="center">📄 Real-Time Collaborative Document Editor</p>
  <p align="center">
    CoEdit Flow is a real-time collaborative document editor inspired by Google Docs, built using modern web technologies to showcase advanced frontend and backend integration.<br />
    This project demonstrates proficiency in building scalable, real-time applications with a focus on user experience and performance.
  </p>
</div>

---

## 📋 Table of Contents

1. [🤖 Introduction](#introduction)
2. [⚙️ Tech Stack](#tech-stack)
3. [🔋 Features](#features)
4. [🤸 Quick Start](#quick-start)
5. [🕸️ Snippets (Code to Copy)](#snippets)
6. [🔗 Links & Assets](#links)
7. [👨‍💻 Author](#author)
8. [📄 License](#license)

---

## 🤖 Introduction

CoEdit Flow was created to demonstrate the power of building real-time collaborative applications with a modern tech stack. It simulates a simplified version of Google Docs, where multiple users can:

- Collaborate on documents in real-time
- View active participants
- Leave comments
- Manage and share documents securely

<a href="https://discord.gg/z73j2jb4" target="_blank">
  <img src="https://github.com/sujatagunale/EasyRead/assets/151519281/618f4872-1e10-42da-8213-1d69e486d02e" alt="Join our Discord community" width="180px" />
</a>

---

## ⚙️ Tech Stack

🖥️ **Frontend**
- Next.js (App Router) — Routing, server functions, and performance optimizations
- TypeScript — Type safety for scalability and maintainability
- Tailwind CSS — Utility-first CSS framework
- ShadCN — UI component library

📚 **Editor**
- Lexical — Modular, performant rich-text editor with custom plugins
- Liveblocks — CRDT-based real-time synchronization, presence tracking, storage

🔐 **Authentication & Authorization**
- Clerk — User auth, role-based access, session management (OAuth, JWT)

💾 **Backend**
- PostgreSQL — Relational database for document metadata and user relationships
- Prisma — Type-safe ORM for database access
- Edge/Serverless Functions — Handle document CRUD and notification logic

🔁 **Realtime & Collaboration**
- Liveblocks Storage & Presence — Conflict-free live editing and presence indicators
- Webhooks — Send notification events or email invites

🚀 **Deployment**
- Vercel — Edge hosting, CI/CD, analytics

---

## 🔋 Features

🔐 **Authentication**
- Secure sign-in and session management via Clerk
- Social login options and email verification
- Role-based access control

📝 **Real-Time Editing**
- Collaborative editing powered by Lexical and Liveblocks
- Rich text formatting with customizable styles
- Image embedding and document structuring

📁 **Document Management**
- Create, delete, search, and organize documents
- Document history and version control
- Categorization and tagging system

🔗 **Sharing & Permissions**
- Share documents with role-based access
- Invite collaborators via email
- Public/private visibility settings

💬 **Commenting**
- Inline and general threaded comments
- @mentions and notifications
- Comment resolution tracking

👥 **Live Presence**
- View active collaborators in real time
- Cursor and selection tracking
- User activity indicators

🔔 **Notifications**
- In-app alerts for collaboration events
- Email notifications for important updates
- Customizable notification preferences

📱 **Responsive Design**
- Optimized UI for desktop and mobile devices
- Consistent experience across different screen sizes
- Touch-friendly controls for mobile editing

---

## 🤸 Quick Start

Follow these steps to set up the project locally on your machine.

### **Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

### **Cloning the Repository**

```bash
git clone https://github.com/Troy2727/coedit_flow.git
cd CoEdit-Flow
```

### **Installation**

Install the project dependencies using npm:

```bash
npm install
```

### **Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Liveblocks
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
```

Replace the placeholder values with your actual Clerk & Liveblocks credentials. You can obtain these credentials by signing up on the [Clerk](https://clerk.com/) and [Liveblocks](https://liveblocks.io/) websites.

### **Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

---

## 🕸️ Snippets

<details>
<summary><code>globals.css</code> (Click to expand)</summary>

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Liveblocks styles */
/* @import "@liveblocks/react-ui/styles.css"; */
/* @import "@liveblocks/react-lexical/styles.css"; */

/* Custom theme */
/* @import "../styles/dark-theme.css"; */

/* TAILWIND STYLES */
@layer base {
  :root {
    background: #09111f;
    color: #fff;
    margin: 0;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
    border-radius: 50px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #09090a;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #2e3d5b;
    border-radius: 50px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #7878a3;
  }
}

/* More styles omitted for brevity */
```

</details>

<details>
<summary><code>tailwind.config.ts</code> (Click to expand)</summary>

```typescript
import type { Config } from 'tailwindcss';

const { fontFamily } = require('tailwindcss/defaultTheme');

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
        xs: '360px',
      },
    },
    extend: {
      colors: {
        blue: {
          100: '#B4C6EE',
          400: '#417BFF',
          500: '#3371FF',
        },
        red: {
          400: '#DD4F56',
          500: '#DC4349',
        },
        dark: {
          100: '#09111F',
          200: '#0B1527',
          300: '#0F1C34',
          350: '#12213B',
          400: '#27344D',
          500: '#2E3D5B',
        },
      },
      /* More configuration omitted for brevity */
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
```

</details>

<details>
<summary><code>types/index.d.ts</code> (Click to expand)</summary>

```typescript
/* eslint-disable no-unused-vars */
declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

declare type AccessType = ["room:write"] | ["room:read", "room:presence:write"];

declare type RoomAccesses = Record<string, AccessType>;

declare type UserType = "creator" | "editor" | "viewer";

/* More type definitions omitted for brevity */
```

</details>

---

## 🔗 Links & Assets

- Public assets used in the project can be found [here](https://drive.google.com/file/d/1MCQaP-imgDdopwcUn4CN_D-WglDc--Ho/view?usp=sharing)
- [Liveblocks Starter Guide](https://liveblocks.io/docs/get-started/nextjs-lexical)

### Useful Links

- [Liveblocks](https://liveblocks.io) - Real-time collaboration infrastructure
- [Lexical](https://lexical.dev/) - Extensible text editor framework
- [Clerk](https://clerk.dev/) - Authentication and user management
- [Next.js](https://nextjs.org) - React framework for production
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [ShadCN](https://ui.shadcn.dev/) - UI component library

💡 **Bonus Tip: Visualizing the Stack**

Many developers include a diagram like this to give a clearer understanding of the application's architecture and flow. This is what it looks like for CoEdit Flow:

```
┌──────────────────────────────────────────────┐
│ Client (Next.js + Lexical + Tailwind)        │
└───────────────┬──────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│ Liveblocks (Realtime Sync, Presence)         │
└───────────────┬──────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│ Database (PostgreSQL via Prisma)             │
└───────────────┬──────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│ Clerk (Auth & RBAC)                          │
└───────────────┬──────────────────────────────┘
                ↓
┌──────────────────────────────────────────────┐
│ Vercel (Deploy & Edge Functions)             │
└──────────────────────────────────────────────┘
```

---

## 👨‍💻 Author

Alex Mieses

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ✨ Crafted with Excellence

© 2025 Alex Mieses. All rights reserved.
