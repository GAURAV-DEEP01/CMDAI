#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO_URL="https://github.com/GAURAV-DEEP01/CLAI"
REPO_DIR="$HOME/clai-repo"
CLAI_DIR="$HOME/.clai"

# Check required dependencies
check_dependency() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is required but not installed. Aborting." >&2
        exit 1
    fi
}

check_dependency git
check_dependency npm
check_dependency ollama

# Clone repository
clone_repo() {
    if [[ -d "$REPO_DIR" ]]; then
        echo "Repository already exists at $REPO_DIR. Pulling latest changes..."
        git -C "$REPO_DIR" pull
    else
        echo "Cloning repository to $REPO_DIR..."
        git clone "$REPO_URL" "$REPO_DIR"
    fi
}

# Configure shell history settings
configure_shellrc() {
    local shell_rc
    local config_content

    if [[ "$SHELL" == *bash ]]; then
        shell_rc="$HOME/.bashrc"
        config_content="# CLAI Configuration
PROMPT_COMMAND=\"history -a\"
shopt -s histappend"
        if ! grep -qF "# CLAI Configuration" "$shell_rc"; then
            echo "Updating $shell_rc configuration..."
            echo "$config_content" >> "$shell_rc"
        fi
    fi
    echo "$shell_rc"
}

# Create .clai directory
create_clai_dir() {
    if [[ ! -d "$CLAI_DIR" ]]; then
        echo "Creating CLAI directory at $CLAI_DIR..."
        mkdir -p "$CLAI_DIR"
    fi
}

# Build project
build_project() {
    echo "Building project..."
    cd "$REPO_DIR"
    npm install
    sudo npm run package
}

# Main execution flow
main() {
    clone_repo
    local shell_rc
    shell_rc=$(configure_shellrc) || exit 1
    create_clai_dir
    build_project
    
    echo -e "\nCLAI setup completed successfully!"
    echo "You may need to restart your shell or run: source $shell_rc"
}

main "$@"
