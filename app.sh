#!/usr/bin/env bash

# ==============================================================================
# TalentSync RMS - Service Management Script
# Allows starting, stopping, restarting, status checks, and log streaming
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="${PROJECT_DIR}/pids"
LOG_DIR="${PROJECT_DIR}/logs"

BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"

BACKEND_PORT=5001
FRONTEND_PORT=5173

# Colors for terminal output
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
CYAN="\033[36m"
BLUE="\033[34m"
NC="\033[0m" # No Color

mkdir -p "${PID_DIR}" "${LOG_DIR}"

is_port_in_use() {
  local port=$1
  lsof -ti ":${port}" >/dev/null 2>&1
}

get_pid_on_port() {
  local port=$1
  lsof -ti ":${port}" 2>/dev/null | head -n 1
}

is_backend_running() {
  if [ -f "${BACKEND_PID_FILE}" ]; then
    local pid
    pid=$(cat "${BACKEND_PID_FILE}" 2>/dev/null)
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      return 0
    fi
  fi
  if is_port_in_use "${BACKEND_PORT}"; then
    return 0
  fi
  return 1
}

is_frontend_running() {
  if [ -f "${FRONTEND_PID_FILE}" ]; then
    local pid
    pid=$(cat "${FRONTEND_PID_FILE}" 2>/dev/null)
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      return 0
    fi
  fi
  if is_port_in_use "${FRONTEND_PORT}"; then
    return 0
  fi
  return 1
}

check_database() {
  if command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready -q 2>/dev/null; then
      echo -e "${YELLOW}⚠️  PostgreSQL does not seem to be running on default port. Ensure Postgres is active.${NC}"
    fi
  fi
}

start_services() {
  echo -e "\n${BOLD}${BLUE}=== Starting TalentSync Application ===${NC}"
  check_database

  # Backend Check & Start
  if is_backend_running; then
    local b_pid
    b_pid=$(get_pid_on_port "${BACKEND_PORT}")
    echo -e "${YELLOW}⚡ Backend is already running (PID: ${b_pid:-unknown}, Port: ${BACKEND_PORT})${NC}"
  else
    echo -e "🚀 Starting Backend on port ${BACKEND_PORT}..."
    (
      cd "${PROJECT_DIR}/backend" || exit 1
      nohup npm run dev >> "${BACKEND_LOG}" 2>&1 &
      echo $! > "${BACKEND_PID_FILE}"
    )
    disown 2>/dev/null || true
  fi

  # Frontend Check & Start
  if is_frontend_running; then
    local f_pid
    f_pid=$(get_pid_on_port "${FRONTEND_PORT}")
    echo -e "${YELLOW}⚡ Frontend is already running (PID: ${f_pid:-unknown}, Port: ${FRONTEND_PORT})${NC}"
  else
    echo -e "🚀 Starting Frontend on port ${FRONTEND_PORT}..."
    (
      cd "${PROJECT_DIR}/frontend" || exit 1
      nohup npm run dev >> "${FRONTEND_LOG}" 2>&1 &
      echo $! > "${FRONTEND_PID_FILE}"
    )
    disown 2>/dev/null || true
  fi

  # Verification Wait
  echo -ne "⏳ Waiting for services to initialize"
  for _ in {1..8}; do
    if is_port_in_use "${BACKEND_PORT}" && is_port_in_use "${FRONTEND_PORT}"; then
      break
    fi
    echo -ne "."
    sleep 0.5
  done
  echo ""

  status_services
  echo -e "\n${GREEN}${BOLD}✔ Application is ready!${NC}"
  echo -e "  🌐 Frontend:  ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
  echo -e "  🔌 Backend:   ${CYAN}http://localhost:${BACKEND_PORT}/api${NC}"
  echo -e "  📋 Logs:      ${PROJECT_DIR}/logs/"
}

stop_services() {
  echo -e "\n${BOLD}${BLUE}=== Stopping TalentSync Application ===${NC}"

  # Stop Backend
  local stopped_backend=false
  if [ -f "${BACKEND_PID_FILE}" ]; then
    local pid
    pid=$(cat "${BACKEND_PID_FILE}" 2>/dev/null)
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      echo -e "🛑 Stopping Backend process (PID ${pid})..."
      kill "${pid}" 2>/dev/null || true
      stopped_backend=true
    fi
    rm -f "${BACKEND_PID_FILE}"
  fi

  # Also kill any remaining processes bound to port 5001
  local port_pids
  port_pids=$(lsof -ti ":${BACKEND_PORT}" 2>/dev/null)
  if [ -n "${port_pids}" ]; then
    echo -e "🛑 Freeing Backend port ${BACKEND_PORT}..."
    echo "${port_pids}" | xargs kill -9 2>/dev/null || true
    stopped_backend=true
  fi

  if [ "${stopped_backend}" = true ]; then
    echo -e "${GREEN}✔ Backend stopped successfully.${NC}"
  else
    echo -e "${YELLOW}ℹ Backend was not running.${NC}"
  fi

  # Stop Frontend
  local stopped_frontend=false
  if [ -f "${FRONTEND_PID_FILE}" ]; then
    local pid
    pid=$(cat "${FRONTEND_PID_FILE}" 2>/dev/null)
    if [ -n "${pid}" ] && kill -0 "${pid}" 2>/dev/null; then
      echo -e "🛑 Stopping Frontend process (PID ${pid})..."
      kill "${pid}" 2>/dev/null || true
      stopped_frontend=true
    fi
    rm -f "${FRONTEND_PID_FILE}"
  fi

  # Also kill any remaining processes bound to port 5173
  local front_port_pids
  front_port_pids=$(lsof -ti ":${FRONTEND_PORT}" 2>/dev/null)
  if [ -n "${front_port_pids}" ]; then
    echo -e "🛑 Freeing Frontend port ${FRONTEND_PORT}..."
    echo "${front_port_pids}" | xargs kill -9 2>/dev/null || true
    stopped_frontend=true
  fi

  if [ "${stopped_frontend}" = true ]; then
    echo -e "${GREEN}✔ Frontend stopped successfully.${NC}"
  else
    echo -e "${YELLOW}ℹ Frontend was not running.${NC}"
  fi

  echo -e "${BOLD}${GREEN}✔ All services have been stopped.${NC}\n"
}

restart_services() {
  echo -e "\n${BOLD}${BLUE}=== Restarting TalentSync Application ===${NC}"
  stop_services
  sleep 1
  start_services
}

status_services() {
  echo -e "\n${BOLD}${BLUE}=== Application Status ===${NC}"

  # Backend Status
  if is_port_in_use "${BACKEND_PORT}"; then
    local b_pid
    b_pid=$(get_pid_on_port "${BACKEND_PORT}")
    echo -e "  Backend  (Port ${BACKEND_PORT}):  ${GREEN}● RUNNING${NC} (PID: ${b_pid:-unknown})"
  else
    echo -e "  Backend  (Port ${BACKEND_PORT}):  ${RED}○ STOPPED${NC}"
  fi

  # Frontend Status
  if is_port_in_use "${FRONTEND_PORT}"; then
    local f_pid
    f_pid=$(get_pid_on_port "${FRONTEND_PORT}")
    echo -e "  Frontend (Port ${FRONTEND_PORT}):  ${GREEN}● RUNNING${NC} (PID: ${f_pid:-unknown})"
  else
    echo -e "  Frontend (Port ${FRONTEND_PORT}):  ${RED}○ STOPPED${NC}"
  fi
  echo ""
}

view_logs() {
  echo -e "\n${BOLD}${CYAN}Streaming live logs (Press Ctrl+C to exit log viewer)...${NC}\n"
  touch "${BACKEND_LOG}" "${FRONTEND_LOG}"
  tail -f -n 50 "${BACKEND_LOG}" "${FRONTEND_LOG}"
}

run_dev_foreground() {
  echo -e "\n${BOLD}${CYAN}=== Starting in Foreground (Press Ctrl+C to Stop) ===${NC}\n"
  check_database
  
  # Trap Ctrl+C to clean up child processes
  trap 'echo -e "\n${YELLOW}Stopping processes...${NC}"; stop_services; exit 0' INT TERM
  
  npm run dev
}

show_menu() {
  while true; do
    echo -e "${BOLD}${CYAN}==================================================${NC}"
    echo -e "${BOLD}${CYAN}          TalentSync Service Manager              ${NC}"
    echo -e "${BOLD}${CYAN}==================================================${NC}"
    echo -e "  ${BOLD}[1]${NC} Start Application (Background)"
    echo -e "  ${BOLD}[2]${NC} Stop Application"
    echo -e "  ${BOLD}[3]${NC} Restart Application"
    echo -e "  ${BOLD}[4]${NC} Check Status"
    echo -e "  ${BOLD}[5]${NC} Run in Foreground (Ctrl+C to Stop)"
    echo -e "  ${BOLD}[6]${NC} View Logs"
    echo -e "  ${BOLD}[7]${NC} Exit"
    echo -e "${BOLD}${CYAN}==================================================${NC}"
    read -rp "Select an option [1-7]: " choice

    case "$choice" in
      1)
        start_services
        ;;
      2)
        stop_services
        ;;
      3)
        restart_services
        ;;
      4)
        status_services
        ;;
      5)
        run_dev_foreground
        ;;
      6)
        view_logs
        ;;
      7|q|Q)
        echo "Exiting."
        exit 0
        ;;
      *)
        echo -e "${RED}Invalid option. Please choose between 1 and 7.${NC}"
        ;;
    esac
    echo ""
  done
}

case "${1:-}" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  status)
    status_services
    ;;
  logs)
    view_logs
    ;;
  dev|foreground)
    run_dev_foreground
    ;;
  help|--help|-h)
    echo -e "${BOLD}Usage:${NC} ./app.sh [start|stop|restart|status|logs|dev]"
    echo ""
    echo "Commands:"
    echo "  start     Start backend & frontend in the background"
    echo "  stop      Stop all running application services"
    echo "  restart   Restart all application services"
    echo "  status    Check if services are running or stopped"
    echo "  logs      View live logs from backend and frontend"
    echo "  dev       Run in foreground (Ctrl+C to stop both)"
    echo "  (none)    Launches an interactive menu"
    ;;
  *)
    show_menu
    ;;
esac
