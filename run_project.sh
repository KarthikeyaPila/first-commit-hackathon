#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
FRONTEND_DIR="${ROOT_DIR}/sutradhar-react"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    trap - INT TERM EXIT

    if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
        kill "${FRONTEND_PID}" 2>/dev/null || true
    fi

    if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
        kill "${BACKEND_PID}" 2>/dev/null || true
    fi

    wait 2>/dev/null || true
}

fail() {
    echo "run_project.sh: $*" >&2
    exit 1
}

trap cleanup INT TERM EXIT

[[ -x "${PYTHON_BIN}" ]] || fail "${PYTHON_BIN} is missing. Create the virtual environment first."
command -v npm >/dev/null 2>&1 || fail "npm is required to run sutradhar-react."
[[ -d "${FRONTEND_DIR}/node_modules" ]] || fail "React dependencies are missing. Run: cd sutradhar-react && npm install"

echo "Starting Sutradhar backend at http://127.0.0.1:8000"
(
    cd "${ROOT_DIR}" || exit 1
    PYTHONPATH=src "${PYTHON_BIN}" -m first_commit.server
) &
BACKEND_PID=$!

echo "Starting Sutradhar frontend at http://127.0.0.1:5173"
(
    cd "${FRONTEND_DIR}" || exit 1
    npm run dev -- --host 127.0.0.1
) &
FRONTEND_PID=$!

echo "Both services are running. Press Ctrl+C to stop them."

while kill -0 "${BACKEND_PID}" 2>/dev/null && kill -0 "${FRONTEND_PID}" 2>/dev/null; do
    sleep 1
done

if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo "The backend stopped; shutting down the frontend." >&2
else
    echo "The frontend stopped; shutting down the backend." >&2
fi

exit 1
