<img
  src="https://raw.githubusercontent.com/Elderflowa/mini-qr-api/refs/heads/main/qr.png"
  alt="Logo"
  width="56"
  height="56"
/>

# mini-qr-api - inspired by MiniQR
[![](https://img.shields.io/badge/github-mini--qr--api-blue?style=flat&logo=github)](https://github.com/elderflowa/mini-qr-api/releases)

**mini-qr-api** is a simple program that generates customizable QR-codes. 
It has user accounts, template management, and a public `/?data=` endpoint, for easy use with queries.

**DISCLAIMER**:
Heavily inspired by [MiniQR](https://github.com/lyqht/mini-qr).
Coded with the use of Claude AI.

## Features

- **User accounts** — register/login with username + password
- **Templates** - tied to user accounts.
- **Admin panel** — toggle signups on/off, manage users, set global default QR template
- **Public QR endpoint** — `GET /qr?data=<url>` renders a fullscreen QR using the global default template, no login required

## Screenshot
| Configuration Page                                                                             |
| ---------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/Elderflowa/mini-qr-api/refs/heads/main/example.png" alt="Configuration" /> |
---

## Quick start
Clone this repo

```bash
git clone https://github.com/elderflowa/mini-qr-api
cd mini-qr-api
```

```bash
cp .env.example .env
# edit .env — set JWT_SECRET and ADMIN_PASSWORD at minimum

docker compose up -d --build
```

App runs on **http://localhost:3232** (or whatever `PORT` is set to).

Default admin credentials: `admin` / `admin` (or whatever you set `ADMIN_PASSWORD` to).

---

## NPM proxy setup

In NPM, add the `qr.mydomain.com` proxy host pointing to the frontend container on port 80.

To support `qr.mydomain.com/https://example.com` style URLs, add this in the Advanced tab:

```nginx
merge_slashes off;
rewrite ^/(https?://.+)$ /?data=$1 redirect;
```

Or just use `qr.mydomain.com/?data=https://example.com` directly — no rewrite needed.

## Environment variables

| Variable         | Default                    | Description                          |
|------------------|----------------------------|--------------------------------------|
| `PORT`           | `8081`                     | Host port for the app                |
| `JWT_SECRET`     | `change-me-in-production`  | Secret for signing JWTs              |
| `ADMIN_PASSWORD` | `admin`                    | Initial admin password (first boot)  |

