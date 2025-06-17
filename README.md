## WIP

```bash
DB_PASSWORD=my_root-password NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS=true BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose up -d --build
```

- doesn't work with gpus
- https://docs.docker.com/compose/how-tos/gpu-support/
- https://hub.docker.com/r/ollama/ollama
