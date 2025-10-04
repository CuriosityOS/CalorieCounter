# CalorieCounter

An AI-powered calorie tracking app that analyzes food images and provides nutritional information.

## Features

- Upload food images and get AI analysis of nutrition content
- Track daily calorie and macro intake
- Save meal history
- User profiles with weight tracking
- Customizable nutrition goals

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Supabase for authentication and database
- AI image analysis via OpenRouter API (using Gemini Flash)

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CalorieCounter.git
cd CalorieCounter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example` and add your API keys:
```
# API Keys
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-key-here
NEXT_PUBLIC_SITE_URL=https://caloriecounter.lol
NEXT_PUBLIC_APP_TITLE=CalorieCounter

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:
```bash
npm run dev
```

## Authentication Setup

This application uses Supabase for authentication. To set up authentication:

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Under Authentication settings, configure:
   - Email auth (enabled by default)
   - **Important:** Disable email confirmation completely
   - No need to set up any redirect URLs
3. Copy your Supabase URL and anonymous key to your `.env.local` file
4. Run the SQL schema in `supabase_setup.sql` in the Supabase SQL editor

## Data Storage

All user data is stored in Supabase:
- No local storage is used for data persistence
- This ensures data consistency across multiple devices
- Daily nutrition totals are calculated from the day's meals in the database
- User preferences, meals, and weight entries are all stored in Supabase

## Troubleshooting Authentication

If you're experiencing authentication issues:

1. Verify environment variables are correctly set
   - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be valid
2. Check browser console for auth-related errors
3. Make sure email confirmation is disabled in Supabase
4. Clear your browser cookies and local storage if experiencing persistent issues

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run cf:build` - Build the Worker bundle for Cloudflare
- `npm run cf:deploy` - Deploy the Worker using Wrangler (requires Cloudflare credentials)

## Cloudflare Deployment

1. Install the Cloudflare CLI and authenticate: `npx wrangler login`.
2. Configure any required environment variables via Wrangler (for example `wrangler secret put NEXT_PUBLIC_SUPABASE_URL`).
3. Deploy the app: `npm run cf:deploy`.

The deploy script runs `next-on-pages` to emit `.vercel/output` and then uses Wrangler to upload the generated Worker script plus static assets. Wrangler will execute the build command defined in `wrangler.toml` automatically during deployment.

## License

MIT
