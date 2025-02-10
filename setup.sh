#!/usr/bin/env sh
set -e

# Configuration
readonly REPO_URL="https://github.com/GAURAV-DEEP01/CMDAI"
readonly REPO_DIR="$HOME/cmdai"
readonly CMDAI_DIR="$HOME/.cmdai"

# Detect shell type
detect_shell() {
    case "$SHELL" in
        */bash) echo "bash" ;;
        */zsh) echo "zsh" ;;
        *) echo "unknown" ;;
    esac
}
SHELL_NAME=$(detect_shell)

# Check required dependencies
check_dependencies() {
    local missing=""
    for cmd in git npm; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing+="$cmd "
        fi
    done
    if [ -n "$missing" ]; then
        echo "Error: Missing dependencies: $missing. Please install them."
        exit 1
    fi
}
check_dependencies

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
            echo "Error: Unsupported shell. Please use bash or zsh." 
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
        chmod 700 "$CMDAI_DIR"
    fi
}

# Build project
build_project() {
    echo "Building project..."
    cd "$REPO_DIR" || { echo "Failed to enter $REPO_DIR"; exit 1; }
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
