#!/bin/bash
# Install Tauri system dependencies for Ubuntu/Debian

echo "Installing Tauri system dependencies..."
sudo apt update
sudo apt install -y libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libsoup2.4-dev \
    libjavascriptcoregtk-4.1-dev

echo "Installation complete!"
echo "You can now run: . $HOME/.cargo/env && bun run tauri dev"
