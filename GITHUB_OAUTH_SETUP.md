# GitHub OAuth Setup Guide

## Step 1: Get Your GitHub Client Secret

1. Go to https://github.com/settings/developers
2. Click on your OAuth App (or create one if you haven't already)
3. Under "Client Secret", click "Generate a new client secret"
4. Copy the secret (you can only see it once!)

## Step 2: Set Environment Variables for Local Development

1. Open `functions/.env.local`
2. Replace `your_github_client_secret_here` with your actual Client Secret
3. Save the file

## Step 3: Update Firebase Environment Variables for Production

When you're ready to deploy, set the environment variable in Firebase:

```bash
cd functions
firebase functions:config:set github.client_secret="your_actual_client_secret"
firebase deploy --only functions
```

## Step 4: Update Authorized Redirect URIs in GitHub

In your GitHub OAuth App settings:
- **Authorization callback URL**: `https://us-central1-studyos-24a46.cloudfunctions.net/githubCallback`

## Testing Locally

The githubCallback function will now:
- Accept the environment variable from `.env.local`
- Log the Client ID it's using
- Provide clear error messages if the Client Secret is missing

Once you set the Client Secret, try the GitHub OAuth flow again!
