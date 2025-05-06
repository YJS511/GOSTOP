// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
    export function useRegisterSW(): {
        needRefresh: boolean
        offlineReady: boolean
        updateServiceWorker: () => void
    }
}
