# Building for Windows 7 (32-bit)

This guide explains how to build the application for Windows 7 32-bit using GitHub Actions.

## Prerequisites for Windows 7 Users

To run the application on Windows 7, the user **MUST** have the **Microsoft Edge WebView2 Runtime** installed.
Since Windows 7 is no longer supported by modern Edge, you must use the **Evergreen Bootstrapper** which will install the last compatible version (Chrome 109).

- **Download Link**: [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)
- **Select**: "Evergreen Bootstrapper"

## How to Build

We effectively use GitHub's infrastructure to build the Windows executable, as cross-compiling correctly from Linux is difficult.

> [!WARNING]
> **Do NOT try to run `bun run tauri build -- --target i686-pc-windows-msvc` on your local Linux machine.**
> This will fail with `error[E0463]: can't find crate for core` or `linker 'link.exe' not found`.
> The MSVC target requires Windows-only build tools. Use the GitHub workflow instead.

1.  **Push your changes** to GitHub.
2.  Go to the **Actions** tab in your repository.
3.  Select the **Windows 7 32-bit Build** workflow from the sidebar.
4.  Click **Run workflow**.
5.  Select the branch (usually `main`) and click **Run workflow**.

## Retrieving the Build

1.  Wait for the build to complete (it may take 10-15 minutes).
2.  Click on the completed run.
3.  Scroll down to the **Artifacts** section.
4.  Click on **PharmacyPos-Win7-32bit** to download a zip file.
5.  Extract the zip file to find the `.exe` installer (e.g., `PharmacyPos_0.1.0_x86_en-US.msi` or similar).

## Troubleshooting

-   **"Application failed to start"**: Ensure Webview2 is installed.
-   **"Entry Point Not Found"**: Ensure Windows 7 is fully updated (Service Pack 1 and later updates).
