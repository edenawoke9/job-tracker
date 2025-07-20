declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          onClick: (callback: () => void) => void
        }
      }
    }
  }
}

export function initTelegramWebApp() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp
    webApp.ready()
    webApp.expand()
    return webApp
  }
  return null
}
