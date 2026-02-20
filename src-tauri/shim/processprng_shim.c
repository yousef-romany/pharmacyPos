/**
 * ProcessPrng compatibility shim for Windows 7
 * 
 * Rust 1.78+ std lib imports ProcessPrng from bcryptprimitives.dll,
 * but this function only exists on Windows 10+.
 * 
 * This shim provides ProcessPrng by wrapping BCryptGenRandom,
 * which IS available on Windows 7.
 * 
 * Place this compiled DLL alongside the .exe for Windows 7 support.
 */
#include <windows.h>
#include <bcrypt.h>

#pragma comment(lib, "bcrypt.lib")

__declspec(dllexport) BOOL WINAPI ProcessPrng(PBYTE pbData, SIZE_T cbData) {
    NTSTATUS status = BCryptGenRandom(
        NULL, pbData, (ULONG)cbData, BCRYPT_USE_SYSTEM_PREFERRED_RNG
    );
    return status == 0;
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved) {
    return TRUE;
}
