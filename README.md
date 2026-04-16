# mini-qr-api

Self-hosted QR code generator with user accounts, template management, and a public `/?data=` endpoint.

## Quick start

```bash
cp .env.example .env
# edit .env — set JWT_SECRET and ADMIN_PASSWORD at minimum

docker compose up -d --build
```

App runs on **http://localhost:3232** (or whatever `PORT` is set to).

Default admin credentials: `admin` / `admin` (or whatever you set `ADMIN_PASSWORD` to).

---

## Features

- **User accounts** — register/login with username + password
- **Admin panel** — toggle signups on/off, manage users, set global default QR template
- **Templates** — create named QR styles:
  - *Classic* — plain black & white, no frills
  - *Custom* — choose dot style, corner style, primary/secondary/background colors, upload a logo
- **Public QR endpoint** — `GET /qr?data=<url>` renders a fullscreen QR using the global default template, no login required

## NPM proxy setup

In NPM, add the `qr.eldr.uk` proxy host pointing to the frontend container on port 80.

To support `qr.eldr.uk/https://example.com` style URLs, add this in the Advanced tab:

```nginx
merge_slashes off;
rewrite ^/(.+)$ /qr?data=$1 redirect;
```

Or just use `qr.eldr.uk/qr?data=https://example.com` directly — no rewrite needed.

## Environment variables

| Variable         | Default                    | Description                          |
|------------------|----------------------------|--------------------------------------|
| `PORT`           | `8081`                     | Host port for the app                |
| `JWT_SECRET`     | `change-me-in-production`  | Secret for signing JWTs              |
| `ADMIN_PASSWORD` | `admin`                    | Initial admin password (first boot)  |

## Data persistence

Data is stored in Docker named volumes:
- `qr-query_data` — SQLite database
- `qr-query_uploads` — uploaded logo files
