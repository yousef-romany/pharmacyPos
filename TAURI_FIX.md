# Fix Tauri Build Errors

## Problem
The Tauri build is failing because required system libraries are not installed:
- `libsoup-2.4`
- `javascriptcoregtk-4.0`

## Solution

Run these commands in your terminal (requires sudo password):

### Step 1: Install System Dependencies

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libsoup-2.4-dev \
    libjavascriptcoregtk-4.0-dev
```

### Step 2: Verify Installation

Check if the libraries are installed:

```bash
pkg-config --modversion libsoup-2.4
pkg-config --modversion javascriptcoregtk-4.0
```

You should see version numbers for both.

### Step 3: Clean Cargo Build Cache

Remove the failed build artifacts:

```bash
cd "/home/yousefx00/Documents/Programing Projects/pharmacyPos"
rm -rf src-tauri/target
```

### Step 4: Run Tauri Dev Again

```bash
. $HOME/.cargo/env && bun run tauri dev
```

## Alternative Package Names

If the above commands don't work, try these alternative package names:

```bash
sudo apt install -y libsoup2.4-dev libjavascriptcoregtk-4.1-dev
```

Or check what's available:

```bash
apt search libsoup
apt search javascriptcoregtk
```

## Troubleshooting

### If packages are not found:

1. Update package lists:
   ```bash
   sudo apt update
   ```

2. Check your Ubuntu version:
   ```bash
   lsb_release -a
   ```

3. For Ubuntu 24.04+, you might need:
   ```bash
   sudo apt install -y libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
   ```

### If pkg-config can't find the libraries:

```bash
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH
```

## What Should Happen

After installing the dependencies and running Tauri dev:
1. Next.js dev server will start (already running on port 3000)
2. Cargo will compile the Rust backend
3. Tauri desktop app window will open
4. Your Next.js app will be displayed in the native window

## Quick Reference

```bash
# Install dependencies
sudo apt update && sudo apt install -y libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev libsoup-2.4-dev libjavascriptcoregtk-4.0-dev

# Clean build cache
cd "/home/yousefx00/Documents/Programing Projects/pharmacyPos" && rm -rf src-tauri/target

# Run Tauri dev
. $HOME/.cargo/env && bun run tauri dev
```
