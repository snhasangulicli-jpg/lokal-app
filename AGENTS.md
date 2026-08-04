# AGENTS.md

## Project Context

This is a standalone React + Vite application. Keep changes focused on the user's request and preserve existing project conventions.

Start with `README.md` for local setup and development workflow.

## Tech Stack & Architecture

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Shadcn UI
- **State & Storage:** React State, LocalStorage (`app_orders`, `app_menu`)
- **Routing:** React Router DOM

## Key Files & Directories

- `src/`: Application source code.
- `src/pages/`: Page components (KitchenScreen, OrderScreen, CashierScreen, ProfileScreen, Login).
- `src/lib/`: Helper utilities and local state management (`staffSession.js`, `menu.js`).
- `vite.config.js`: Vite build configuration.

## Development Workflow

- Run local development server: `npm run dev`
- Build for production: `npm run build`