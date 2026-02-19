# Rust Installation Guide for Tauri Development

## Problem
The error `failed to get cargo metadata: No such file or directory (os error 2)` indicates that Cargo (Rust's package manager) is not installed on your system.

## Solution: Install Rust and Cargo

### Linux (Ubuntu/Debian)

#### Option 1: Using rustup (Recommended)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the prompts:
1. Type `1` to proceed with installation
2. After installation, reload your shell:
   ```bash
   source $HOME/.cargo/env
   ```

#### Option 2: Using apt (Alternative)
```bash
sudo apt update
sudo apt install rustc cargo
```

### Verify Installation
```bash
rustc --version
cargo --version
```

You should see version numbers like:
- `rustc 1.70.0 (or newer)`
- `cargo 1.70.0 (or newer)`

## Additional System Dependencies

Tauri also requires some system-level dependencies. Install them:

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
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

### Fedora
```bash
sudo dnf install webkit2gtk3-devel.x86_64 \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
```

### Arch Linux
```bash
sudo pacman -Syu
sudo pacman -S webkit2gtk base-devel curl wget file libappindicator-gtk3 librsvg
```

## After Installation

1. **Restart your terminal** or reload your shell:
   ```bash
   source $HOME/.cargo/env
   ```

2. **Navigate to your project directory**:
   ```bash
   cd "/home/yousefx00/Documents/Programing Projects/pharmacyPos"
   ```

3. **Run Tauri dev**:
   ```bash
   bun run tauri dev
   ```

## Troubleshooting

### Issue: "cargo command not found"
**Solution**: Add Cargo to your PATH by running:
```bash
echo 'source $HOME/.cargo/env' >> ~/.bashrc
source ~/.bashrc
```

### Issue: "Permission denied"
**Solution**: Ensure you have proper permissions or use `sudo` for system-level installations.

### Issue: "webview2 not found" (Windows)
**Solution**: Install WebView2 from https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Issue: Build errors
**Solution**: Ensure you have the latest Rust toolchain:
```bash
rustup update
rustup default stable
```

## Quick Reference Commands

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reload shell
source $HOME/.cargo/env

# Update Rust
rustup update

# Check versions
rustc --version
cargo --version

# Run Tauri dev
bun run tauri dev
```

## Project-Specific Notes

This project requires:
- Rust 1.60 or higher (specified in src-tauri/Cargo.toml)
- Tauri 1.8.0
- Next.js 15.2.3
- The project uses a static export configuration for Tauri desktop app

## Next Steps

After successful Rust installation:
1. Run `bun run tauri dev` to start the development server
2. The Tauri CLI will automatically run `npm run dev` before launching the desktop app
3. The app will open in a native window with your Next.js frontend

## Support

If you encounter issues:
- Check Rust installation: https://www.rust-lang.org/tools/install
- Tauri documentation: https://tauri.app/v1/guides/
- Project-specific docs: See README.md and AGENTS.md in this repository
