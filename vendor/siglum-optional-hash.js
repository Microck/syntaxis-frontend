// blake3-wasm@2.1.5 publishes a browser entry pointing to a missing JS file.
// Siglum explicitly handles a rejected optional accelerator import and uses
// its built-in DJB2 change-detection hash. This is not used for authentication,
// signatures, package integrity, or cryptographic verification.
throw new Error('Optional BLAKE3 accelerator unavailable; using Siglum change-detection fallback.');
export {};
