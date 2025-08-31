#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
GRAY='\033[0;90m'
LIGHT_GRAY='\033[0;37m'
RESET='\033[0m'

# Read JSON input from stdin
input=$(cat)

# Extract current session ID and model info from Claude Code input
session_id=$(echo "$input" | jq -r '.session_id // empty')
model_name=$(echo "$input" | jq -r '.model.display_name // empty')
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
output_style=$(echo "$input" | jq -r '.output_style.name // empty')

# Extract cost data from Claude Code Status hook
session_cost_usd=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
session_duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')

# Get current git branch with error handling
if git rev-parse --git-dir >/dev/null 2>&1; then
    branch=$(git branch --show-current 2>/dev/null || echo "detached")
    if [ -z "$branch" ]; then
        branch="detached"
    fi
    
    # Check for pending changes (staged or unstaged)
    if ! git diff-index --quiet HEAD -- 2>/dev/null || ! git diff-index --quiet --cached HEAD -- 2>/dev/null; then
        # Get line changes for unstaged and staged changes
        unstaged_stats=$(git diff --numstat 2>/dev/null | awk '{added+=$1; deleted+=$2} END {print added+0, deleted+0}')
        staged_stats=$(git diff --cached --numstat 2>/dev/null | awk '{added+=$1; deleted+=$2} END {print added+0, deleted+0}')
        
        # Parse the stats
        unstaged_added=$(echo $unstaged_stats | cut -d' ' -f1)
        unstaged_deleted=$(echo $unstaged_stats | cut -d' ' -f2)
        staged_added=$(echo $staged_stats | cut -d' ' -f1)
        staged_deleted=$(echo $staged_stats | cut -d' ' -f2)
        
        # Total changes
        total_added=$((unstaged_added + staged_added))
        total_deleted=$((unstaged_deleted + staged_deleted))
        
        # Build the branch display with changes (with colors)
        changes=""
        if [ $total_added -gt 0 ]; then
            changes="${GREEN}+$total_added${RESET}"
        fi
        if [ $total_deleted -gt 0 ]; then
            if [ -n "$changes" ]; then
                changes="$changes ${RED}-$total_deleted${RESET}"
            else
                changes="${RED}-$total_deleted${RESET}"
            fi
        fi
        
        if [ -n "$changes" ]; then
            branch="$branch${PURPLE}*${RESET} ($changes)"
        else
            branch="$branch${PURPLE}*${RESET}"
        fi
    fi
else
    branch="no-git"
fi

# Use full path but replace home directory with ~
dir_path="$current_dir"
if [[ "$dir_path" == "$HOME"* ]]; then
    dir_path="~${dir_path#$HOME}"
fi

# Get today's date in YYYYMMDD format
today=$(date +%Y%m%d)

# Function to format numbers
format_cost() {
    printf "%.2f" "$1"
}

format_tokens() {
    local tokens=$1
    if [ "$tokens" -ge 1000000 ]; then
        printf "%.1fM" "$(echo "scale=1; $tokens / 1000000" | bc -l)"
    elif [ "$tokens" -ge 1000 ]; then
        printf "%.1fK" "$(echo "scale=1; $tokens / 1000" | bc -l)"
    else
        printf "%d" "$tokens"
    fi
}

format_time() {
    local minutes=$1
    local hours=$((minutes / 60))
    local mins=$((minutes % 60))
    if [ "$hours" -gt 0 ]; then
        printf "%dh %dm" "$hours" "$mins"
    else
        printf "%dm" "$mins"
    fi
}

format_duration_ms() {
    local ms=$1
    local minutes=$((ms / 60000))
    format_time "$minutes"
}

# Initialize variables with defaults
session_cost="0.00"
session_tokens=0
daily_cost="0.00"
block_cost="0.00"
remaining_time="N/A"
session_duration=""

# Use Claude Code cost data if available, otherwise fallback to ccusage
if [ "$session_cost_usd" != "0" ] && [ "$session_cost_usd" != "null" ]; then
    session_cost="$session_cost_usd"
    if [ "$session_duration_ms" != "0" ] && [ "$session_duration_ms" != "null" ]; then
        session_duration=$(format_duration_ms "$session_duration_ms")
    fi
fi

# Always get session tokens from ccusage when session_id is available
if command -v ccusage >/dev/null 2>&1 && [ -n "$session_id" ] && [ "$session_id" != "empty" ]; then
    # Use the new ccusage session --id functionality to get session data
    session_data=$(ccusage session --id "$session_id" --json 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$session_data" ] && [ "$session_data" != "null" ]; then
        # If we don't have cost from Claude Code, get it from ccusage
        if [ "$session_cost" = "0.00" ] || [ "$session_cost" = "0" ]; then
            session_cost=$(echo "$session_data" | jq -r '.totalCost // 0')
        fi
        # Calculate only input + output tokens (exclude cache tokens for meaningful display)
        session_tokens=$(echo "$session_data" | jq -r '.entries | map(.inputTokens + .outputTokens) | add // 0')
    fi
fi

if command -v ccusage >/dev/null 2>&1; then
    # Get daily data
    daily_data=$(ccusage daily --json --since "$today" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$daily_data" ]; then
        daily_cost=$(echo "$daily_data" | jq -r '.totals.totalCost // 0')
    fi
    
    # Get active block data
    block_data=$(ccusage blocks --active --json 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$block_data" ]; then
        active_block=$(echo "$block_data" | jq -r '.blocks[] | select(.isActive == true) // empty')
        if [ -n "$active_block" ] && [ "$active_block" != "null" ]; then
            block_cost=$(echo "$active_block" | jq -r '.costUSD // 0')
            remaining_minutes=$(echo "$active_block" | jq -r '.projection.remainingMinutes // 0')
            if [ "$remaining_minutes" != "0" ] && [ "$remaining_minutes" != "null" ]; then
                remaining_time=$(format_time "$remaining_minutes")
            fi
        fi
    fi
fi

# Format the output
formatted_session_cost=$(format_cost "$session_cost")
formatted_daily_cost=$(format_cost "$daily_cost")
formatted_block_cost=$(format_cost "$block_cost")
formatted_tokens=$(format_tokens "$session_tokens")

# Build the first line: branch / style / folder / model
first_line="${LIGHT_GRAY}🌿 $branch ${GRAY}|${LIGHT_GRAY} 💄 $output_style ${GRAY}|${LIGHT_GRAY} 📁 $dir_path ${GRAY}|${LIGHT_GRAY} 🤖 $model_name${RESET}"

# Build the second line: pricing and tokens
session_cost_display="\$$formatted_session_cost"
if [ -n "$session_duration" ]; then
    session_cost_display="$session_cost_display ${GRAY}($session_duration)${LIGHT_GRAY}"
fi

second_line="${LIGHT_GRAY}💰 $session_cost_display ${GRAY}|${LIGHT_GRAY} 📅 \$$formatted_daily_cost ${GRAY}|${LIGHT_GRAY} 🧊 \$$formatted_block_cost"

if [ "$remaining_time" != "N/A" ]; then
    second_line="$second_line ($remaining_time left)"
fi

second_line="$second_line ${GRAY}|${LIGHT_GRAY} 🧩 ${formatted_tokens} ${GRAY}tokens${RESET}"

printf "%b\n%b\n" "$first_line" "$second_line"