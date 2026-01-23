# Violin Mentor

Violin Mentor is a Next.js application designed to help users practice the violin. It provides real-time feedback on pitch and intonation through three distinct modes: a real-time Tuner, a guided Practice mode with sheet music, and an Analytics Dashboard to track progress.

## Quickstart

1.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

2.  **Run the Development Server:**

    ```bash
    pnpm dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Starts the development server.                    |
| `pnpm build`        | Builds the application for production.            |
| `pnpm lint`         | Runs the linter to check for code quality issues. |
| `pnpm lint:fix`     | Automatically fixes linting issues.               |
| `pnpm format`       | Formats the code using Prettier.                  |
| `pnpm format:check` | Checks for formatting issues without fixing them. |

## Repository Structure

A brief overview of the key directories in this project:

- `app/`: The main entry point of the Next.js application, containing the layout and page structure.
- `components/`: Contains the React components used to build the UI for each mode.
- `docs/`: Contains all project documentation.
- `hooks/`: Contains custom React hooks.
- `lib/`: Core application logic, including:
  - `exercises/`: Data for practice exercises.
  - `stores/`: Zustand stores for state management (`tuner`, `practice`, `analytics`).
  - `pitch-detector.ts`: The YIN algorithm implementation for pitch detection.
- `public/`: Static assets, such as images and MusicXML files.
- `styles/`: Global CSS styles.
