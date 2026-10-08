#!/usr/bin/env bash
# Quick stop script for TalentSync
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${DIR}/app.sh" stop
