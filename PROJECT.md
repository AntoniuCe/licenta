# K3s Demo Store — E-Commerce Platform on Raspberry Pi Cluster

## Overview

A full-stack, high-availability e-commerce marketplace built as a bachelor's
thesis project, deployed on a self-managed k3s Kubernetes cluster running on
3 Raspberry Pi 4B nodes. The system demonstrates production-grade patterns:
distributed storage, database failover, rolling deployments, and public
internet exposure — all on low-cost ARM hardware.

**Author:** Cecan Antoniu (Max)
**Program:** Applied Computer Science, Final Year — Politehnica University of Timișoara
**Supervisor:** Conf. Dr. Rickman Radu

---

## Tech Stack

### Infrastructure
- **Orchestration:** k3s (lightweight Kubernetes), 3 nodes
  - pi-1 — 192.168.1.101 (control-plane + worker)
  - pi-2 — 192.168.1.102 (control-plane + worker)
  - pi-3 — 192.168.1.103 (control-plane + worker, 1GB RAM — known instability)
- **Load Balancing:** MetalLB (L2 mode, IP 192.168.1.200)
- **Ingress:** Traefik
- **Storage:** Longhorn (distributed block storage, replicated across nodes)
- **Database:** CloudNativePG (CNPG) — HA PostgreSQL cluster (`ecommerce-pg`)
- **Public Exposure:** Cloudflare Tunnel (systemd service on pi-1)
  - store.antoniu.xyz → frontend
  - api.antoniu.xyz → backend

### Backend
- Go + Gin (HTTP framework)
- GORM (ORM)
- JWT authentication
- Google OAuth 2.0 (Google Identity Services)
- bcrypt password hashing
- Goroutine-based async SMTP email (payment confirmations)
- PostgreSQL driver via CNPG-managed cluster

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS
- lucide-react (icons)

### DevOps
- Docker Buildx (multi-arch ARM64 builds)
- Docker Hub (image registry)
- Helm (Traefik installation)
- kubectl (cluster management)

---

## Repository / Project Structure

```
licenta/
├── backend/
│   ├── cmd/
│   │   └── main.go                 # Entrypoint, routes, CORS
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go           # JWT secret loading
│   │   ├── database/
│   │   │   └── database.go         # GORM connection + AutoMigrate
│   │   ├── middleware/
│   │   │   ├── auth.go             # JWT auth middleware
│   │   │   └── admin.go            # Admin-only middleware
│   │   ├── models/
│   │   │   ├── user.go
│   │   │   ├── product.go
│   │   │   ├── product_image.go
│   │   │   ├── cart.go
│   │   │   ├── order.go
│   │   │   ├── payment.go
│   │   │   ├── review.go
│   │   │   └── wishlist.go
│   │   ├── handlers/
│   │   │   ├── auth_handler.go
│   │   │   ├── google_handler.go
│   │   │   ├── product_handler.go
│   │   │   ├── cart_handler.go
│   │   │   ├── order_handler.go
│   │   │   ├── review_handler.go
│   │   │   ├── wishlist_handler.go
│   │   │   └── admin_handler.go
│   │   └── services/
│   │       └── email.go            # HTML payment confirmation emails
│   ├── go.mod / go.sum
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css / index.css
│   │   ├── lib/
│   │   │   ├── api.js               # apiFetch wrapper, API_BASE, FILE_BASE
│   │   │   └── google.js            # Google Sign-In script loader
│   │   ├── utils/
│   │   │   └── helpers.js           # cn(), parseJwt(), normalizeProduct/Cart
│   │   ├── pages/
│   │   │   └── MarketplacePage.jsx  # Main app state + orchestration
│   │   └── components/
│   │       ├── layout/
│   │       │   └── Layout.jsx       # Header, Hero, Footer
│   │       ├── common/
│   │       │   └── UI.jsx           # Card, Message, SectionTitle
│   │       ├── auth/
│   │       │   └── AuthScreen.jsx   # Login/Register + Google Sign-In
│   │       ├── products/
│   │       │   └── ProductViews.jsx # Catalog, carousel, detail view
│   │       ├── cart/
│   │       │   └── CartViews.jsx    # Cart, checkout, card payment, orders
│   │       └── admin/
│   │           └── AdminViews.jsx   # Product CRUD, user management
│   ├── package.json
│   └── Dockerfile
│
├── k8s/
│   ├── 00-namespace/
│   │   └── namespace.yaml
│   ├── 01-longhorn/
│   │   └── longhorn-pvc.yaml
│   ├── 02-postgres/
│   │   └── postgres.yaml
│   ├── 03-secrets/
│   │   └── secrets.yaml
│   ├── 04-app/
│   │   ├── backend.yaml
│   │   └── frontend.yaml
│   ├── 05-ingress/
│   │   └── ingress.yaml
│   └── 06-metallb/
│       └── metallb-ippool.yaml
│
├── docker-compose.yml   # Local dev environment
├── INSTALL.md           # Full cluster setup guide
└── README.md
```

---

## Architecture

```
                     ┌─────────────────────────┐
                     │   Cloudflare Tunnel      │
                     │  store.antoniu.xyz       │
                     │  api.antoniu.xyz         │
                     └───────────┬─────────────┘
                                 │
                     ┌───────────▼─────────────┐
                     │   Traefik (Ingress)      │
                     │   via MetalLB 192.168.1.200│
                     └───────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                                      │
     ┌────────▼────────┐                   ┌─────────▼────────┐
     │  Frontend (x3)   │                   │   Backend (x3)    │
     │  React/Vite/     │──── REST API ────▶│  Go/Gin/GORM/JWT  │
     │  Tailwind (nginx)│                   │                    │
     └──────────────────┘                   └─────────┬──────────┘
                                                        │
                                             ┌──────────▼──────────┐
                                             │  CloudNativePG (x3)  │
                                             │  Postgres HA Cluster │
                                             └──────────┬──────────┘
                                                        │
                                             ┌──────────▼──────────┐
                                             │  Longhorn Storage    │
                                             │  (uploads PVC, RWX)  │
                                             └──────────────────────┘

     All pods spread across pi-1 / pi-2 / pi-3 via topologySpreadConstraints.
```

---

## Data Model

- **User** — email, hashed password (empty for Google users), role (user/admin)
- **Product** — name, description, category, price, stock, is_featured, images[]
- **ProductImage** — image_url, is_primary
- **Cart / CartItem** — one cart per user, items with quantity
- **Order / OrderItem** — snapshot of price at purchase time, status (pending/paid/cancelled)
- **Payment** — linked to order, amount, method, status
- **Review** — product rating (1–5) + comment
- **WishlistItem** — user ↔ product favorites

---

## API Summary

### Public
- `POST /api/register`
- `POST /api/login`
- `POST /api/google-login`
- `GET  /api/products`
- `GET  /api/products/:id`
- `GET  /api/products/:id/reviews`

### Authenticated (JWT required)
- `GET    /api/cart`
- `POST   /api/cart`
- `PUT    /api/cart/:id`
- `DELETE /api/cart/:id`
- `DELETE /api/cart`
- `POST   /api/orders`
- `GET    /api/orders`
- `POST   /api/orders/:id/pay`
- `GET    /api/wishlist`
- `POST   /api/wishlist/:id`
- `DELETE /api/wishlist/:id`
- `POST   /api/products/:id/reviews`

### Admin only (JWT + admin role)
- `POST   /api/admin/products`
- `PUT    /api/admin/products/:id`
- `PUT    /api/admin/products/:id/featured`
- `DELETE /api/admin/products/:id`
- `GET    /api/admin/users`
- `PUT    /api/admin/users/:id/role`
- `DELETE /api/admin/products/:id/images/:imageId`
- `PUT    /api/admin/products/:id/images/:imageId/primary`

---

## High Availability Behavior

| Layer | Behavior on node failure | Recovery time |
|-------|---------------------------|----------------|
| etcd | 2/3 alive → quorum OK, cluster stays writable | Immediate |
| k3s scheduler | Detects pods gone, reschedules to live nodes | ~30–60s |
| Postgres (CNPG) | Replica promoted to primary, service endpoint updated | ~30s |
| Longhorn uploads | Volume degrades to fewer replicas, stays mounted | Immediate |
| Traefik | Stops routing to dead node via readiness probes | ~10–30s |

**Important constraint:** pi-1 must always start first and shut down last
(etcd quorum). The cluster tolerates exactly 1 of 3 nodes failing — if 2 fail,
the cluster freezes.

**MetalLB clarification:** MetalLB does *not* load balance traffic. It only
assigns a LAN IP to the service via L2 ARP announcement. Actual traffic
distribution across backend pods is handled by kube-proxy's iptables rules,
which is statistical/probabilistic, not strict round-robin.

---

## Known Issues / In-Progress Work
- **Pi-3 instability:** Only 1GB RAM; repeatedly drops from the cluster,
  causing Longhorn volumes to show "unknown" robustness and CNPG to stall at
  0/3 ready instances. Candidate replacements: Orange Pi RV2 or Raspberry Pi 5.

---

## Key Engineering Notes

- **CNPG `postgres` role:** Reserved for operator use; cannot be managed via
  `managed.roles`. The `postgres` superuser password is only set once at
  bootstrap via `initdb.secret` and is not continuously reconciled. A
  dedicated `ecommerce_app` role was created instead, with
  `ALTER DEFAULT PRIVILEGES`, and its credentials stored in
  `ecommerce-app-credentials`.
- **pg_hba.conf behavior:** `local all all peer` allows local socket auth
  (bypasses password checks); `host all all scram-sha-256` requires the
  correct password over TCP.
- **ARM64 builds:** All Docker images must be built with
  `--platform linux/arm64` via Docker Buildx. `VITE_*` environment variables
  must be baked in at build time (Vite inlines them at build, not at
  container runtime).
- **Topology spread constraints:** Set to `ScheduleAnyway` (not
  `DoNotSchedule`) in `backend.yaml`, `frontend.yaml`, and `postgres.yaml` so
  pods can still schedule even when a node is briefly unavailable.
- **kubeconfig access:** Direct `scp` of `/etc/rancher/k3s/k3s.yaml` fails
  due to root-only permissions; copy it to `/home/toni/` first, then `scp`.
- **Helm on pi-1:** Requires `~/.kube/config` for the user running Helm
  commands — copy from `/etc/rancher/k3s/k3s.yaml`.
- **Longhorn on low-resource nodes:** SD card I/O is the main bottleneck;
  replica count should be tuned to match the number of genuinely healthy
  nodes.

---

## Deployment Order (Cluster Bootstrap)

1. Prepare all 3 Pis (64-bit OS, cgroups enabled, hostnames set)
2. Set up local DNS (Pi-hole) for `pi-1.local`, `pi-2.local`, `pi-3.local`
3. Bootstrap k3s HA control plane (`--cluster-init` on pi-1, join on pi-2/pi-3)
4. Install MetalLB + apply IP pool
5. Install Traefik via Helm
6. Install Longhorn + apply namespace + uploads PVC
7. Install CNPG operator + apply secrets + Postgres cluster
8. Build and push ARM64 Docker images (backend + frontend)
9. Apply backend/frontend deployments + ingress
10. Set up Cloudflare Tunnel for public exposure

Full step-by-step commands are in `INSTALL.md`.

---
