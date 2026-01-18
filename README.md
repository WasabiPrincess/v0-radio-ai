# AIラジオアプリ

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/y17msd1018-6132s-projects/v0-ai)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/ujfeWJXq7Km)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/y17msd1018-6132s-projects/v0-ai](https://vercel.com/y17msd1018-6132s-projects/v0-ai)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/ujfeWJXq7Km](https://v0.app/chat/ujfeWJXq7Km)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Environment Variables

Server-side TTS uses the Gemini API speech generation endpoint. Set these in your deployment or local environment:

- `GEMINI_API_KEY` (required)
- `GEMINI_CHAT_MODEL` (optional, default: `gemini-2.5-flash`)
- `GEMINI_TTS_MODEL` (optional, default: `gemini-2.5-flash-preview-tts`)
- `GEMINI_TTS_VOICE_NAME` (optional, default: `Kore`)

`GOOGLE_CLOUD_CREDENTIALS` is not used for Gemini API TTS or chat.