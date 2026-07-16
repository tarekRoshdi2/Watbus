# Hostinger Deployment Guide

This folder contains the production-ready build of the WhatsApp ChatCore System.

## Deployment Steps

1. **Upload Files**: Upload the entire contents of this `HOSTINGER` folder to your Hostinger File Manager (usually inside `public_html` or a subdomain folder).
2. **Setup Node.js App**:
   - Go to your Hostinger hPanel and open **Node.js Dashboard**.
   - Create a new Node.js Application.
   - Set the **Application Root** to the folder where you uploaded these files.
   - Set the **Application Startup File** to `app.js`.
3. **Install Dependencies**:
   - In the Node.js Dashboard for your app, click on **Run NPM Install** to install the production dependencies from `package.json`.
4. **Environment Variables**:
   - Rename `.env.example` to `.env`.
   - Edit the `.env` file and insert your active `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, as well as your `GEMINI_API_KEY`.
5. **Start Application**:
   - Click **Start App** or **Restart** in the Node.js Dashboard.

Your system is now live, and your Supabase database is perfectly connected to it!
