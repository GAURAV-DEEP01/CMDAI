#!/usr/bin/env sh
set -e

# Configuration
REPO_URL="https://github.com/GAURAV-DEEP01/CMDAI"
REPO_DIR="$HOME/cmdai"
CMDAI_DIR="$HOME/.cmdai"

# Detect shell type
SHELL_NAME=$(basename "$SHELL")

# Check required dependencies
check_dependency() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is required but not installed. Aborting." >&2
        exit 1
    fi
}
check_dependency git
check_dependency npm

# Clone repository
clone_repo() {
    if [ -d "$REPO_DIR" ]; then
        echo "Repository already exists at $REPO_DIR. Pulling latest changes..."
        git -C "$REPO_DIR" pull
    else
        echo "Cloning repository to $REPO_DIR..."
        git clone "$REPO_URL" "$REPO_DIR"
    fi
}

# Configure shell history settings
configure_shellrc() {
    local shell_rc=""
    case "$SHELL_NAME" in
        bash) 
            shell_rc="$HOME/.bashrc"
            local config_content="# CMDAI Configuration\nPROMPT_COMMAND=\"history -a\"\nshopt -s histappend"
            if ! grep -qF "# CMDAI Configuration" "$shell_rc" 2>/dev/null; then
                echo "Updating $shell_rc configuration..."
                echo "$config_content" >> "$shell_rc"
            fi
            ;;
        zsh)  
            shell_rc="$HOME/.zshrc" 
            ;;
        *)    
            echo "Error: Unsupported shell. Please use a supported shell such as bash or zsh." 
            return 1 
            ;;
    esac
    echo "$shell_rc"
}

# Create .cmdai directory
create_cmdai_dir() {
    if [ ! -d "$CMDAI_DIR" ]; then
        echo "Creating CMDAI directory at $CMDAI_DIR..."
        mkdir -p "$CMDAI_DIR"
    fi
}

# Build project
build_project() {
    echo "Building project..."
    cd "$REPO_DIR"
    npm install
    if [ "$SHELL_NAME" = "bash" ]; then
        sudo npm run package
    else
        npm run package
    fi
}

# Main execution flow
main() {
    clone_repo
    shell_rc=$(configure_shellrc) || exit 1
    create_cmdai_dir
    build_project
    echo "
 ██████╗  ███╗   ███╗  ██████╗    █████╗   ██╗
██╔════╝  ████╗ ████║  ██╔══██╗  ██╔══██╗  ██║
██║       ██╔████╔██║  ██║  ██║  ███████║  ██║
██║       ██║╚██╔╝██║  ██║  ██║  ██╔══██║  ██║
╚██████╗  ██║ ╚═╝ ██║  ██████╔╝  ██║  ██║  ██║
 ╚═════╝  ╚═╝     ╚═╝  ╚═════╝   ╚═╝  ╚═╝  ╚═╝"

echo "\ncmdai setup completed successfully!"
echo "To get started:"
echo "Run \033[1;32mcmdai --help\033[0m to list all the commands."
    if [ "$SHELL_NAME" = "bash" ]; then
        echo "You may need to restart your shell or run: source $shell_rc"
    fi
    if ! command -v ollama >/dev/null 2>&1; then
        echo "Ollama is not installed. You may need to install Ollama."
    fi
}

main
