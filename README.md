# CalorieCounter V1.0

A web application built with Next.js, React, and TypeScript that uses AI (via OpenRouter and Gemini Flash) to analyze images of food and estimate nutritional information (calories, protein, carbs, fat).

## Features

*   **Image Upload**: Upload images of food items.
*   **AI Analysis**: Sends images to an AI model (Gemini Flash via OpenRouter) for analysis.
*   **Nutrition Estimation**: Displays estimated calories, protein, carbs, and fat based on AI response.
*   **Meal History**: Stores analyzed meals in client-side state (using Zustand).
*   **Dark/Light Mode**: Toggle theme preference.
*   **Styling**: Uses Tailwind CSS and shadcn/ui components.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn or pnpm
*   An OpenRouter API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CuriosityOS/CalorieCounter.git
    cd CalorieCounter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up environment variables:**
    *   Create a file named `.env.local` in the project root.
    *   Add your OpenRouter API key to this file:
        ```env
        NEXT_PUBLIC_OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY_HERE"

        # Optional: Set these if deploying or running on a different port
        # NEXT_PUBLIC_SITE_URL="http://localhost:5000" # Your app's URL
        # NEXT_PUBLIC_APP_TITLE="CalorieCounter"
        ```
    *   **Important:** The `.env.local` file is included in `.gitignore` and should **not** be committed to version control.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    **Run the production server:**
    ```bash
    npm run build
    npm start
    ```

5.  Open [http://localhost:5000](http://localhost:5000) (or your configured port) in your browser.

## Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Library**: React
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State Management**:
    *   Zustand (Client-side state)
    *   TanStack Query (Server state, caching)
*   **AI Integration**: OpenRouter (using `google/gemini-flash-1.5`)
*   **Form Handling**: React Hook Form (planned)
*   **Validation**: Zod (planned)

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is open source. (Consider adding a specific license like MIT if desired).
