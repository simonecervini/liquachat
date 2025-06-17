## WIP

```bash
DB_PASSWORD=my_root-password NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS=true BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose up -d --build
```

- doesn't work with gpus
- https://docs.docker.com/compose/how-tos/gpu-support/
- https://hub.docker.com/r/ollama/ollama

## Authentication WIP

The app uses [better-auth](https://github.com/better-auth/better-auth) and comes configured with anonymous login and GitHub OAuth authentication.

### GitHub OAuth Setup

To enable GitHub authentication:

1. Create a new OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
2. Set the following:
   - Homepage URL: `http://localhost:3000` (for local development)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. After creating the app, you'll get a Client ID and Client Secret
4. Add these to your environment variables:
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

**Note:** For production, you'll want to create a separate OAuth App with your production domain URLs.

### Local Development

For local development, you can either:

- Configure GitHub OAuth as described above
- Use anonymous login by setting `NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS=true` (enabled by default in the docker-compose setup)
- If you don't plan to use GitHub auth during development, you can set dummy values for the GitHub environment variables
