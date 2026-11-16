# ExceptionPro — Hostinger KVM 2 VPS Deployment Guide

This document provides the complete, repeatable step-by-step instructions to deploy and update the **ExceptionPro** application (**Spring Boot 3.3.2 + Java 21 Backend**, **React + TypeScript + Vite Frontend**, and **PostgreSQL 16 + Flyway Database**) on **Hostinger KVM 2 VPS**.

---

## 1. Server Specifications & Architecture

| Resource | Hostinger KVM 2 Spec | Allocation Strategy |
| :--- | :--- | :--- |
| **vCPU** | 2 vCPU Cores | Shared across Nginx, Spring Boot, and PostgreSQL 16 |
| **Memory** | 8 GB RAM | ~1.5 GB PostgreSQL, ~2 GB Spring Boot JVM (`-Xmx2048m`), ~512 MB Nginx/OS |
| **Storage** | 100 GB NVMe SSD | Docker images, PostgreSQL volume (`postgres_data`), and File Uploads volume (`uploads_data`) |
| **Bandwidth** | 8 TB | Served via Nginx with gzip compression |
| **Database** | PostgreSQL 16 + Flyway | Automated schema migrations (`V1` to `V27`, including `V12_1` and `V22_1`) |

### Container Architecture
- **`exceptionpro-db` (PostgreSQL 16)**: Runs on internal Docker network port `5432`, persisted via Docker volume `postgres_data`.
- **`exceptionpro-backend` (Spring Boot + Java 21)**: Runs on internal port `9090`, executes Flyway migrations automatically on startup, and persists uploaded documents/images in Docker volume `uploads_data`.
- **`exceptionpro-frontend` (React + Nginx)**: Listens on public port `80` (and `443` with SSL), serves the compiled React production bundle (`dist/`), and reverse-proxies `/api/*` and `/uploads/*` directly to `exceptionpro-backend:9090`.

---

## 2. One-Time VPS Initial Setup (First Deployment Only)

### Step 1: Connect to Hostinger VPS via SSH
Open your terminal (or PowerShell) and connect to your Hostinger VPS IP address:
```bash
ssh root@<YOUR_VPS_IP>
```

### Step 2: Update Ubuntu Packages & Configure Firewall (UFW)
```bash
apt update && apt upgrade -y
apt install -y curl git ufw ca-certificates gnupg lsb-release

# Allow SSH, HTTP, and HTTPS traffic
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### Step 3: Install Docker Engine & Docker Compose Plugin
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
docker compose version
```

### Step 4: Clone the ExceptionPro Repository on VPS
```bash
mkdir -p /opt/exceptionpro
cd /opt/exceptionpro
git clone <YOUR_GIT_REPOSITORY_URL> .
```
*(Or copy your project folder to `/opt/exceptionpro` using `scp` / FileZilla / WinSCP.)*

---

## 3. Required Docker & Configuration Files

Ensure the following files exist in your project on the VPS (`/opt/exceptionpro`):

### 3.1 Verify Flyway Migration Files in `backend/src/main/resources/db/migration/`
Make sure both intermediate table creation scripts exist so Flyway succeeds on a fresh PostgreSQL 16 database:
- `backend/src/main/resources/db/migration/V12_1__create_collaboration_requisition_tables.sql`
- `backend/src/main/resources/db/migration/V22_1__create_purchase_receipts_and_reconciliations_tables.sql`

And verify `backend/src/main/resources/application.yml` has `out-of-order: true` under `spring.flyway`:
```yaml
  flyway:
    enabled: true
    baseline-on-migrate: true
    out-of-order: true
```

### 3.2 Backend Dockerfile (`backend/Dockerfile`)
Create `backend/Dockerfile`:
```dockerfile
# Stage 1: Build Spring Boot JAR with Maven & Java 21
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run with Java 21 JRE (tuned for 8 GB RAM KVM 2 VPS)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN mkdir -p /app/uploads
COPY --from=build /app/target/*.jar app.jar
EXPOSE 9090
ENTRYPOINT ["java", "-Xms512m", "-Xmx2048m", "-jar", "app.jar"]
```

### 3.3 Frontend Nginx Configuration (`frontend/nginx.conf`)
Create `frontend/nginx.conf` so Nginx serves React routes and proxies `/api/` and `/uploads/` to the backend container:
```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 210M;

    root /usr/share/nginx/html;
    index index.html;

    # Reverse proxy API calls to Spring Boot backend
    location /api/ {
        proxy_pass http://backend:9090/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Reverse proxy uploaded files to Spring Boot backend
    location /uploads/ {
        proxy_pass http://backend:9090/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React Router SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.4 Frontend Dockerfile (`frontend/Dockerfile`)
Create `frontend/Dockerfile`:
```dockerfile
# Stage 1: Build React + TypeScript Frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.5 Root `docker-compose.yml` (`/opt/exceptionpro/docker-compose.yml`)
Create `docker-compose.yml` in the root directory (`/opt/exceptionpro/docker-compose.yml`):
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: exceptionpro-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: buyersupplier
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sgtesting}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d buyersupplier"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - exceptionpro-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: exceptionpro-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/buyersupplier
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-sgtesting}
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
      SPRING_FLYWAY_ENABLED: "true"
      SPRING_FLYWAY_BASELINE_ON_MIGRATE: "true"
      SPRING_FLYWAY_OUT_OF_ORDER: "true"
    volumes:
      - uploads_data:/app/uploads
    expose:
      - "9090"
    networks:
      - exceptionpro-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: exceptionpro-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - exceptionpro-net

volumes:
  postgres_data:
  uploads_data:

networks:
  exceptionpro-net:
    driver: bridge
```

> **Note on `frontend/src/services/api.ts`**:
> When serving through Nginx reverse proxy on your VPS IP or domain, set `baseURL` in `frontend/src/services/api.ts` to `import.meta.env.VITE_API_URL || ''` (empty string uses relative URLs `/api/...` through Nginx on port 80/443, avoiding CORS and `localhost:9090` issues in the user's browser).

---

## 4. First-Time Build & Launch Commands

Run these commands from `/opt/exceptionpro` on your Hostinger VPS:

```bash
cd /opt/exceptionpro

# 1. If a previous migration failed on an empty DB volume, reset the volume cleanly:
docker compose down -v

# 2. Build and start all containers in detached mode:
docker compose up -d --build

# 3. Check container status:
docker compose ps
```

### Verify Flyway Migrations & Backend Startup
```bash
# Watch backend startup and Flyway migration logs:
docker compose logs -f backend
```
You should see:
- `Successfully applied ... migrations to schema "public", now at version v27`
- `Started ExceptionProApplication in ... seconds`

### Verify PostgreSQL 16 Tables
```bash
docker exec -it exceptionpro-db psql -U postgres -d buyersupplier -c "\dt"
```

Now open `http://<YOUR_VPS_IP>` in your browser to access ExceptionPro!

---

## 5. Checklist for Every Future Deployment (Next Deployment Steps)

Whenever you make code or database changes in the future and want to deploy the latest version to your Hostinger KVM 2 VPS, follow these exact steps:

### Step 1: SSH into the VPS and Go to Project Directory
```bash
ssh root@<YOUR_VPS_IP>
cd /opt/exceptionpro
```

### Step 2: Take a Quick Database Backup Before Deploying (Recommended Safety Step)
```bash
mkdir -p /opt/exceptionpro/backups
docker exec -t exceptionpro-db pg_dump -U postgres buyersupplier > /opt/exceptionpro/backups/backup_$(date +%F_%H-%M-%S).sql
```

### Step 3: Pull the Latest Code
```bash
git pull origin main
```

### Step 4: Rebuild and Restart Containers (WITHOUT `-v` so Data is Preserved!)
> **IMPORTANT**: Never use `docker compose down -v` on subsequent deployments, because `-v` deletes your PostgreSQL database volume. Use:
```bash
docker compose up -d --build
```

### Step 5: Verify Logs & Clean Up Old Unused Docker Images
```bash
# Check container health
docker compose ps

# Check backend & Flyway logs
docker compose logs --tail=100 backend

# Free up NVMe disk space from old Docker build layers
docker image prune -f
```

---

## 6. Troubleshooting Quick Reference

| Issue | Command / Fix |
| :--- | :--- |
| **View PostgreSQL logs** | `docker compose logs --tail=50 postgres` |
| **View Spring Boot backend logs** | `docker compose logs --tail=100 -f backend` |
| **View Nginx frontend logs** | `docker compose logs --tail=50 frontend` |
| **Check Flyway migration history table** | `docker exec -it exceptionpro-db psql -U postgres -d buyersupplier -c "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;"` |
| **Remove a failed Flyway migration record (without losing DB data)** | `docker exec -it exceptionpro-db psql -U postgres -d buyersupplier -c "DELETE FROM flyway_schema_history WHERE success = false;"` then run `docker compose restart backend` |
| **Check VPS RAM & CPU usage** | `docker stats --no-stream` and `free -h` |
| **Check NVMe Disk usage** | `df -h` |

---

## why your browser shows 189.72.153.133 took too long to respond for both URLs, and how to fix both in 3 minutes:

### Cause 1: Why Port `9090` (`http://189.72.153.133:9090/swagger-ui/index.html`) Timed Out
In `docker compose ps`, the `exceptionpro-backend` service shows:
```text
PORTS: 9090/tcp
```
Notice it says `9090/tcp` instead of `0.0.0.0:9090->9090/tcp`. This happens when `docker-compose.yml` uses `expose: - "9090"` (which only exposes port `9090` inside the internal Docker network) instead of `ports: - "9090:9090"`, and port `9090` is not yet opened in Ubuntu's `ufw` firewall.

### Cause 2: Why Port `80` (`http://189.72.153.133`) Timed Out
A **"took too long to respond" (`ERR_CONNECTION_TIMED_OUT`)** message in the browser when `0.0.0.0:80->80/tcp` is already running means **inbound packets are being blocked before reaching Docker**, almost always by the external **Hostinger hPanel Cloud Firewall**.

---

### Step-by-Step Solution

#### Step 1: Test Locally Inside Your VPS Terminal First
Run this command on your VPS (`root@srv2160542:/opt/exceptionpro#`):
```bash
curl -I http://127.0.0.1:80
```
- If this prints `HTTP/1.1 200 OK`, Nginx and your Frontend container are working properly inside the VPS, and the block is external (see Step 3).

#### Step 2: Expose Port `9090` for Swagger & Backend API
1. Open `/opt/exceptionpro/docker-compose.yml`:
   ```bash
   nano /opt/exceptionpro/docker-compose.yml
   ```
2. Under the `backend:` service, change:
   ```yaml
       expose:
         - "9090"
   ```
   to:
   ```yaml
       ports:
         - "9090:9090"
   ```
   Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

3. Open port `9090` in the Ubuntu `ufw` firewall and restart the containers:
   ```bash
   ufw allow 9090/tcp
   ufw reload
   docker compose up -d
   docker compose ps
   ```
   Now `docker compose ps` will show `0.0.0.0:9090->9090/tcp` for `exceptionpro-backend`.

4. Verify Swagger responds locally on the VPS:
   ```bash
   curl -I http://127.0.0.1:9090/swagger-ui/index.html
   ```
   *(Should return `HTTP/1.1 200`)*

#### Step 3: Open Ports in Hostinger hPanel Firewall (Most Common Reason for Browser Timeout)
Hostinger KVM VPS has an external **Cloud Firewall** in the Hostinger dashboard that filters traffic before it reaches Ubuntu's `ufw`:
1. Log in to **Hostinger hPanel** -> go to **VPS** -> select your server (`srv2160542` / `189.72.153.133`).
2. In the left sidebar, click **Security** -> **Firewall** (or **Settings** -> **Firewall**).
3. Check if a Firewall configuration is **Active**:
   - Either **Disable/Deactivate** the hPanel Cloud Firewall (since `ufw` is already active inside Ubuntu), **OR**
   - Edit the active Firewall rules in hPanel and add rules to **Accept TCP** on:
     - Port **`80`** (Source: Anywhere `0.0.0.0/0`)
     - Port **`443`** (Source: Anywhere `0.0.0.0/0`)
     - Port **`9090`** (Source: Anywhere `0.0.0.0/0`)
   - Click **Sync** / **Apply** in hPanel.

#### Step 4: Verify Frontend API Base URL & Backend CORS for Browser Requests
1. **Frontend API URL (`frontend/src/services/api.ts`)**:
   - If `baseURL` is hardcoded to `'http://localhost:9090'`, opening `http://189.72.153.133` on a remote computer will try to call `localhost:9090` on that user's computer instead of the VPS.
   - Change `baseURL` in `frontend/src/services/api.ts` to:
     ```ts
     baseURL: import.meta.env.VITE_API_URL || '',
     ```
     so requests go to `/api/...` on `http://189.72.153.133` and are proxied by Nginx to `backend:9090`.
2. **Backend CORS (`backend/src/main/java/com/exceptionpro/config/SecurityConfig.java`)**:
   - Ensure `corsConfigurationSource()` allows `http://189.72.153.133` (or uses `configuration.setAllowedOriginPatterns(List.of("*"))`) so browser requests from the VPS IP or domain are permitted.



