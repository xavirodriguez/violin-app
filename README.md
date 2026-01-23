# Violin Mentor

Violin Mentor is a web-based application designed to help violinists of all levels improve their skills. It provides real-time feedback on intonation, interactive sheet music for practice, and analytics to track progress over time.

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)

## Architecture

This project is a [Next.js](https://nextjs.org/) application built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/).

- **UI Framework**: [shadcn/ui](https://ui.shadcn.com/) components built on top of [Radix UI](https://www.radix-ui.com/) and styled with [Tailwind CSS](https://tailwindcss.com/).
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) is used for global state management, particularly for the tuner, practice, and analytics features.
- **Sheet Music Rendering**: [OpenSheetMusicDisplay (OSMD)](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) is used to render MusicXML files as interactive sheet music.
- **Pitch Detection**: Real-time pitch detection is implemented using the YIN algorithm in `lib/pitch-detector.ts` to provide feedback to the user.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 22 or later recommended)
- [pnpm](https://pnpm.io/)

### Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <repository-name>
pnpm install
```

### Running Locally

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run:

- `pnpm dev`: Runs the app in development mode.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Lints the source files.
- `pnpm lint:fix`: Lints and automatically fixes problems.
- `pnpm format`: Formats source files with Prettier.
- `pnpm format:check`: Checks formatting without writing changes.

## Project Structure

A brief overview of the key directories:

- `app/`: The main application entry point and routing structure for Next.js.
- `components/`: Contains reusable React components, organized by feature.
- `lib/`: Core application logic, including pitch detection (`pitch-detector.ts`), music theory (`musical-note.ts`), and state stores (`stores/`).
- `hooks/`: Custom React hooks.
- `public/`: Static assets, including MusicXML files for exercises.
- `e2e/`: End-to-end tests written with Playwright.
