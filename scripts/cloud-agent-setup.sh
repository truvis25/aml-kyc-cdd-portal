#!/usr/bin/env bash
set -euo pipefail

# Cursor Cloud / coding-agent bootstrap for launch-readiness testing.
# Installs the toolchain needed for:
#   npm ci, npm run build, supabase db reset/test, and Playwright E2E.

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
export CHECKPOINT_DISABLE="${CHECKPOINT_DISABLE:-1}"

CHECK_ONLY=0
if [[ "${1:-}" == "--check-only" ]]; then
  CHECK_ONLY=1
fi

install_node_22() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p "process.versions.node.split('.')[0]")"
    if [[ "$major" == "22" ]]; then
      echo "Node.js 22 already installed: $(node --version)"
      return
    fi
  fi

  echo "Installing Node.js 22..."
  $SUDO apt-get update
  $SUDO apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash -
  $SUDO apt-get install -y nodejs
}

install_supabase_cli() {
  if command -v supabase >/dev/null 2>&1; then
    echo "Supabase CLI already installed: $(supabase --version)"
    return
  fi

  echo "Installing Supabase CLI..."
  local tmp
  tmp="$(mktemp -d)"
  curl -fsSL \
    https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
    -o "$tmp/supabase_linux_amd64.tar.gz"
  tar -xzf "$tmp/supabase_linux_amd64.tar.gz" -C "$tmp"
  $SUDO install "$tmp/supabase" /usr/local/bin/supabase
  rm -rf "$tmp"
}

start_docker_if_available() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker CLI not found; install Docker in the base image for Supabase local tests."
    return
  fi

  if docker version >/dev/null 2>&1; then
    echo "Docker daemon already running."
    return
  fi

  if command -v service >/dev/null 2>&1; then
    $SUDO service docker start || true
  fi

  if ! docker version >/dev/null 2>&1 && command -v dockerd >/dev/null 2>&1; then
    echo "Starting dockerd in the background..."
    $SUDO dockerd --host=unix:///var/run/docker.sock >/tmp/dockerd.log 2>&1 &
    for _ in {1..20}; do
      docker version >/dev/null 2>&1 && break
      sleep 1
    done
  fi

  if docker version >/dev/null 2>&1; then
    echo "Docker daemon is running."
  else
    echo "Docker daemon is still unavailable; Supabase local tests will be blocked."
  fi
}

if [[ "$CHECK_ONLY" == "0" ]]; then
  install_node_22
  npm ci
  npx playwright install --with-deps chromium
  install_supabase_cli
  start_docker_if_available
fi

node --version
npm --version
supabase --version
if command -v docker >/dev/null 2>&1; then
  docker version --format 'Docker {{.Server.Version}}' 2>/dev/null || echo "Docker daemon unavailable"
else
  echo "Docker CLI unavailable"
fi
