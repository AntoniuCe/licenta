# K3s HA Cluster — Full Setup Guide
## Stack: 3 Raspberry Pis · k3s · MetalLB · Traefik · Longhorn · CloudNativePG · Cloudflare Tunnel

---

## Cluster layout

| Node | Hostname | IP | Role |
|------|----------|------|------|
| Pi 1 | `pi-1` | 192.168.1.101 | control-plane + worker |
| Pi 2 | `pi-2` | 192.168.1.102 | control-plane + worker |
| Pi 3 | `pi-3` | 192.168.1.103 | control-plane + worker (1GB RAM — unstable) |
| MetalLB pool | — | 192.168.1.200–210 | LAN IPs for services |

All 3 nodes run etcd + control plane + worker.
Tolerated failure: **1 node** (etcd quorum = 2/3). If 2 nodes go down, the
cluster freezes. **pi-1 must always start first and shut down last.**

---

## Phase 0 — Prepare every Pi (repeat on ALL 3)

### 0.1 — OS
Flash **Raspberry Pi OS Lite 64-bit** or **Ubuntu Server 24.04 arm64**.
64-bit is required — Longhorn does not support 32-bit ARM.

### 0.2 — Enable cgroups (mandatory for k3s)
```bash
sudo nano /boot/firmware/cmdline.txt
```
Append to the **end of the single existing line** (no new line):
```
cgroup_memory=1 cgroup_enable=memory
```
Then reboot:
```bash
sudo reboot
```

### 0.3 — Set hostname
```bash
# On pi-1:
sudo hostnamectl set-hostname pi-1
# On pi-2:
sudo hostnamectl set-hostname pi-2
# On pi-3:
sudo hostnamectl set-hostname pi-3
```

### 0.4 — Set static IPs (NetworkManager / nmcli)
```bash
sudo nmcli con mod "Wired connection 1" ipv4.addresses 192.168.1.10X/24
sudo nmcli con mod "Wired connection 1" ipv4.gateway 192.168.1.1
sudo nmcli con mod "Wired connection 1" ipv4.dns "1.1.1.1,8.8.8.8"
sudo nmcli con mod "Wired connection 1" ipv4.method manual
sudo nmcli con up "Wired connection 1"
```

### 0.5 — Install Longhorn dependencies
```bash
sudo apt-get update
sudo apt-get install -y open-iscsi nfs-common curl
sudo systemctl enable iscsid
sudo systemctl start iscsid
```

---

## Phase 1 — Install k3s HA cluster

### 1.1 — Bootstrap first control plane (run on pi-1 ONLY)

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --disable=traefik \
  --disable=servicelb \
  --tls-san pi-1 \
  --tls-san pi-2 \
  --tls-san pi-3 \
  --tls-san 192.168.1.101 \
  --tls-san 192.168.1.102 \
  --tls-san 192.168.1.103
```

Flag notes:
- `--cluster-init` starts a new embedded etcd cluster (HA mode)
- `--disable=traefik` and `--disable=servicelb` because we install these ourselves
- `--tls-san` adds all node IPs/hostnames to the API server TLS cert

**Important:** in addition to the install flags above, also create a
persistent config file so k3s's addon manager doesn't regenerate Traefik's
manifest and re-enable it on every restart:

```bash
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/config.yaml <<EOF
disable:
  - traefik
  - servicelb
EOF
sudo systemctl restart k3s
```

Do this on **all 3 nodes** — the `--disable` install flags alone are not
persisted across upgrades/restarts unless this config file also exists.

Wait until the node is ready:
```bash
sudo kubectl get nodes
# NAME   STATUS   ROLES                       AGE
# pi-1   Ready    control-plane,etcd,master   1m
```

Grab the join token — you'll need it for the other two Pis:
```bash
sudo cat /var/lib/rancher/k3s/server/node-token
# Save this output as TOKEN
```

### 1.2 — Join second and third control planes (run on pi-2 AND pi-3)

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --server https://192.168.1.101:6443 \
  --token <YOUR_TOKEN> \
  --disable=traefik \
  --disable=servicelb \
  --tls-san pi-1 \
  --tls-san pi-2 \
  --tls-san pi-3
```

Remember to also create `/etc/rancher/k3s/config.yaml` with the same
`disable: [traefik, servicelb]` block on pi-2 and pi-3.

Verify from pi-1 after both have joined:
```bash
sudo kubectl get nodes
# All 3 should show Ready, role control-plane,etcd,master
```

### 1.3 — Copy kubeconfig to your laptop / Windows machine

```bash
# On pi-1, copy out of the root-owned location first:
sudo cp /etc/rancher/k3s/k3s.yaml /home/toni/k3s.yaml
sudo chown toni:toni /home/toni/k3s.yaml
```
Then `scp` `/home/toni/k3s.yaml` to your machine as `~/.kube/config`
(direct `scp` of the original file fails due to root permissions).
Replace `server: https://127.0.0.1:6443` with `server: https://192.168.1.101:6443`.

Also copy it to `~/.kube/config` on pi-1 itself (for the `toni` user) so
`helm` commands work locally:
```bash
mkdir -p ~/.kube
cp /home/toni/k3s.yaml ~/.kube/config
```

---

## Phase 2 — MetalLB (bare-metal load balancer)

```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml

# Wait for MetalLB pods to be ready
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=120s

# Apply IP pool — edit the IP range first if your subnet is different
kubectl apply -f k8s/06-metallb/metallb-ippool.yaml
```

> **Note:** MetalLB does not load-balance traffic between pods. It only
> assigns a LAN IP to a Service via L2 ARP announcement. Actual request
> distribution across backend replicas happens through kube-proxy's
> iptables rules (statistical, not strict round-robin).

---

## Phase 3 — Traefik (ingress controller)

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update

helm install traefik traefik/traefik \
  --namespace kube-system \
  --set service.type=LoadBalancer \
  --set ports.web.port=80 \
  --set ports.websecure.port=443
```

Check what IP MetalLB assigned to Traefik:
```bash
kubectl get svc -n kube-system traefik
# EXTERNAL-IP should show 192.168.1.200 (first IP in your pool)
```

If Traefik keeps disappearing after this, it means Phase 1's
`/etc/rancher/k3s/config.yaml` step was skipped or not applied on all nodes —
go back and apply it, then reinstall Traefik.

---

## Phase 4 — Longhorn (distributed storage)

```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.6.2/deploy/longhorn.yaml

# Wait for all Longhorn pods — takes 2–4 minutes on Pi
kubectl get pods -n longhorn-system --watch
# All should reach Running/Completed before continuing

# Create namespace then apply the uploads PVC
kubectl apply -f k8s/00-namespace/namespace.yaml
kubectl apply -f k8s/01-longhorn/longhorn-pvc.yaml

# Verify PVC is Bound
kubectl get pvc -n ecommerce
# NAME          STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS
# uploads-pvc   Bound    ...      5Gi        RWX            longhorn
```

> **Note:** on low-resource nodes (like pi-3 with 1GB RAM), SD card I/O is
> the real bottleneck. Keep replica count realistic relative to how many
> nodes are actually healthy at a given time.

---

## Phase 5 — CloudNativePG operator + Postgres HA cluster

```bash
# Install the operator
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.23/releases/cnpg-1.23.0.yaml

kubectl wait --for=condition=Available deployment/cnpg-controller-manager \
  -n cnpg-system --timeout=120s

# Apply secrets first (edit passwords before running this!)
kubectl apply -f k8s/03-secrets/secrets.yaml

# Deploy the 3-instance Postgres cluster
kubectl apply -f k8s/02-postgres/postgres.yaml

# Watch cluster come up — takes 2–3 minutes on Pi
kubectl get cluster -n ecommerce --watch
# READY should go from 0/3 -> 1/3 -> 2/3 -> 3/3
```

Verify the primary:
```bash
kubectl cnpg status ecommerce-pg -n ecommerce
# Shows which pod is primary and replica status
```

### 5.1 — Create a dedicated app role (do NOT use `postgres` superuser)

CNPG's `managed.roles` rejects the `postgres` role since it's reserved for
operator use, and its password is only set once at bootstrap via
`initdb.secret` — it is not continuously reconciled. Instead, create a
dedicated role for the application:

```yaml
# Add to the Cluster spec in postgres.yaml:
managed:
  roles:
    - name: ecommerce_app
      ensure: present
      login: true
      passwordSecret:
        name: ecommerce-app-credentials
```

Then grant it access via `ALTER DEFAULT PRIVILEGES` in a bootstrap job or
`psql` session, and create the matching Kubernetes secret:

```bash
kubectl create secret generic ecommerce-app-credentials \
  -n ecommerce \
  --from-literal=username=ecommerce_app \
  --from-literal=password=<STRONG_PASSWORD>
```

Update `backend-secrets` (`k8s/03-secrets/secrets.yaml`) to use
`ecommerce_app` / the new password for `DB_USER` / `DB_PASSWORD` instead of
`postgres`, then re-apply:
```bash
kubectl apply -f k8s/03-secrets/secrets.yaml
kubectl rollout restart deployment/backend -n ecommerce
```

> `pg_hba.conf` note: `local all all peer` allows local socket auth
> (bypasses password checks entirely); `host all all scram-sha-256` requires
> the correct password over TCP — this is what your Go backend uses.

---

## Phase 6 — Build Docker images for ARM64

The official Dockerfile must target `linux/arm64` — Pi hardware will not run
`amd64` images.

From your **laptop** (not on the Pi):
```bash
# Enable multi-arch builds once
docker buildx create --use --name multiarch
docker buildx inspect --bootstrap

# Build and push backend
cd path/to/your/backend
docker buildx build \
  --platform linux/arm64 \
  -t your-dockerhub/ecommerce-backend:latest \
  --push .

# Build and push frontend
cd path/to/your/frontend
docker buildx build \
  --platform linux/arm64 \
  --build-arg VITE_API_URL=https://api.antoniu.xyz \
  --build-arg VITE_GOOGLE_CLIENT_ID=your-google-client-id \
  -t your-dockerhub/ecommerce-frontend:latest \
  --push .
```

> `VITE_*` env vars are baked into the JS bundle at **build time** by Vite —
> they cannot be injected at container runtime. Any change requires a
> rebuild + push + rollout.

Then update the `image:` field in:
- `k8s/04-app/backend.yaml`
- `k8s/04-app/frontend.yaml`

---

## Phase 7 — CORS in main.go

Make sure `main.go`'s CORS config includes your production hostnames before
building:

```go
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{
        "https://store.antoniu.xyz",
        "http://localhost:5173",  // keep for local dev
    },
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
}))
```

---

## Phase 8 — Deploy the application

```bash
kubectl apply -f k8s/04-app/backend.yaml
kubectl apply -f k8s/04-app/frontend.yaml
kubectl apply -f k8s/05-ingress/ingress.yaml

# Watch all pods come up
kubectl get pods -n ecommerce -o wide --watch

# Expected: 3 backend pods + 3 frontend pods, spread across pi-1/pi-2/pi-3
```

> Topology spread constraints in `backend.yaml`, `frontend.yaml`, and
> `postgres.yaml` are set to `ScheduleAnyway` (not `DoNotSchedule`) so pods
> can still schedule even if a node is briefly unavailable.

---

## Phase 9 — Public exposure via Cloudflare Tunnel

Run `cloudflared` as a systemd service on pi-1, pointed at Traefik's
**NodePort** (not ClusterIP — NodePort survives Traefik reinstalls without
IP drift):

```bash
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
```

Tunnel config (`/etc/cloudflared/config.yml` or via Cloudflare dashboard):
```yaml
ingress:
  - hostname: store.antoniu.xyz
    service: http://127.0.0.1:32011   # Traefik web NodePort
  - hostname: api.antoniu.xyz
    service: http://127.0.0.1:32011
  - service: http_status:404
```

Find Traefik's actual NodePort:
```bash
kubectl get svc -n kube-system traefik -o jsonpath='{.spec.ports[?(@.name=="web")].nodePort}'
```

Restart the tunnel after any config change:
```bash
sudo systemctl restart cloudflared
```

Open `https://store.antoniu.xyz` in your browser. Done.

---

## Demonstrating node failover (presentation script)

### Terminal setup (open 3 windows before the demo)

**Window 1 — watch nodes:**
```bash
watch -n2 kubectl get nodes -o wide
```

**Window 2 — watch pods:**
```bash
watch -n2 kubectl get pods -n ecommerce -o wide
```

**Window 3 — watch Postgres:**
```bash
watch -n2 kubectl cnpg status ecommerce-pg -n ecommerce
```

**Browser** — keep the store open and keep refreshing.

### Demo steps

1. Show all 3 nodes `Ready`, 6 pods `Running`, app loading fine
2. **Pull the power on pi-2** (or `sudo shutdown now` via SSH)
3. After ~20 seconds: pi-2 shows `NotReady` in Window 1
4. After ~40 seconds: pods that were on pi-2 are `Terminating`, new pods start on pi-1/pi-3 (Window 2)
5. If pi-2 was the Postgres primary: Window 3 shows a new primary elected
6. **Browser still works** — refresh during failover, you may get one failed request, then it recovers
7. Plug pi-2 back in — within 2–3 minutes it rejoins, pods rebalance, Longhorn re-replicates

### What is actually happening

| Layer | What happens | Recovery time |
|-------|-------------|---------------|
| etcd | 2/3 alive → quorum OK → cluster stays writable | Immediate |
| k3s scheduler | Detects pods gone, reschedules to live nodes | ~30–60s |
| Postgres (CNPG) | Replica promoted to primary, Service endpoint updated | ~30s |
| Longhorn uploads | Volume degrades to fewer replicas, stays mounted | Immediate |
| Traefik | Stops routing to dead node via readiness probes | ~10–30s |

**Caveat:** if 2 of 3 nodes go down simultaneously, etcd loses quorum and
the entire control plane freezes — this is expected and worth mentioning
during a thesis defense as a known limitation of a 3-node HA setup.

---

## Useful commands

```bash
# Overall cluster health
kubectl get nodes -o wide
kubectl get pods -n ecommerce -o wide
kubectl get pods -n longhorn-system

# Postgres HA status
kubectl cnpg status ecommerce-pg -n ecommerce

# See which Postgres pod is primary
kubectl get pods -n ecommerce -l cnpg.io/cluster=ecommerce-pg \
  -o custom-columns=NAME:.metadata.name,ROLE:.metadata.labels."cnpg\.io/instanceRole"

# Check the uploads volume replicas in Longhorn
kubectl get pvc -n ecommerce
kubectl get volumes -n longhorn-system

# Check ingress routing
kubectl get ingress -n ecommerce
kubectl get svc -n kube-system | grep traefik

# Tail backend logs across all 3 pods
kubectl logs -n ecommerce -l app=backend --prefix --follow

# Force delete a stuck pod (for testing)
kubectl delete pod <name> -n ecommerce --grace-period=0 --force

# Check cloudflared tunnel status
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Pods stuck `Pending` | Longhorn not ready or PVC unbound | `kubectl describe pvc uploads-pvc -n ecommerce` |
| Backend `CrashLoopBackOff` | DB not ready yet or wrong secret | `kubectl logs -n ecommerce deploy/backend` |
| `exec format error` on Pi | Image built for amd64, not arm64 | Rebuild with `--platform linux/arm64` |
| Traefik keeps reappearing/disappearing | Missing `/etc/rancher/k3s/config.yaml` with `disable: [traefik, servicelb]` | Create the file on all 3 nodes, restart k3s, reinstall Traefik |
| Backend still connects as `postgres` | `backend-secrets` not updated / not rolled out | Re-apply secret, then `kubectl rollout restart deployment/backend -n ecommerce` |
| Domain not resolving publicly | Cloudflare Tunnel misconfigured or DNS not proxied | Check tunnel status and `ingress` rules in the Cloudflare dashboard |
| CORS error in browser | `AllowOrigins` in main.go doesn't include your public hostname | Add the hostname to CORS config, rebuild backend image |
| MetalLB IP pool conflict | Chosen IPs overlap with router DHCP range | Pick IPs outside DHCP range |
| pi-3 randomly drops from cluster | 1GB RAM insufficient under load | Reduce pod density on pi-3, consider hardware upgrade (Pi 5 / Orange Pi RV2) |
| `scp` of k3s.yaml fails | File is root-owned | Copy to a non-root path first (e.g. `/home/toni/`), then `scp` |
