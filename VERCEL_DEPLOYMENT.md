# Vercel Deployment Guide

This guide explains how to deploy the Financial Insights App to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`

## Deployment Steps

### 1. Push to GitHub

First, ensure all your changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

### 3. Environment Variables

Add these environment variables in Vercel's project settings:

- `OPENAI_API_KEY` - Your OpenAI API key (optional, for AI features)
- `OPENROUTER_API_KEY` - Your OpenRouter API key (optional, for AI features)

### 4. Deploy

Click "Deploy" and Vercel will build and deploy your application.

## What's Included

### Frontend (Vite + React)
- Automatic builds and deployments
- Global CDN distribution
- HTTPS by default

### API (Serverless Functions)
The following endpoints are available as serverless functions:

- `/api/orders/recent` - Get recent trading orders
- `/api/summary/daily` - Get daily trading summary
- `/api/query` - Natural language SQL queries (mock implementation)
- `/api/schema` - Get database schema information
- `/api/realtime` - Server-Sent Events for real-time updates

### Current Limitations

1. **Database**: Currently using in-memory mock data. For production, you should:
   - Use Vercel Postgres
   - Or connect to Supabase, PlanetScale, or another cloud database
   - Update the `/api/_lib/db.js` file with real database connections

2. **Real-time Updates**: Using Server-Sent Events (SSE) instead of WebSockets
   - In development, falls back to polling due to Vite proxy limitations
   - Production uses proper SSE connections

3. **AI Features**: The text-to-SQL functionality is mocked. To enable real AI:
   - Add your OpenAI/OpenRouter API key
   - Update `/api/query.js` to use the actual AI service

## Local Development

To run locally with Vercel CLI:

```bash
vercel dev
```

This will simulate the Vercel environment locally.

## Next Steps

1. **Set up a real database**:
   - Create a Vercel Postgres database
   - Update connection strings in environment variables
   - Modify `/api/_lib/db.js` to use real database queries

2. **Enable AI features**:
   - Add OpenAI/OpenRouter API keys
   - Implement real text-to-SQL in `/api/query.js`

3. **Optimize performance**:
   - Enable Vercel Analytics
   - Set up proper caching headers
   - Optimize bundle sizes

## Troubleshooting

- **Build fails**: Check the build logs in Vercel dashboard
- **API errors**: Check function logs in Vercel dashboard
- **CORS issues**: Already handled in API functions
- **Environment variables**: Ensure they're added in Vercel project settings

## Support

For issues specific to this deployment setup, check:
- Vercel documentation: https://vercel.com/docs
- Vite + Vercel guide: https://vitejs.dev/guide/static-deploy.html#vercel