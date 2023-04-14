import { useEffect, useRef, useState } from "react"
import { create } from "zustand"
import { getStorage, setStorage, delStorage } from "~/lib/storage"

interface IMediaStore {
  isDark: boolean
  toggle: () => void
}

const useMediaStore = create<IMediaStore>(() => {
  return {
    isDark: false,
    toggle: () => void 0,
  }
})

const isServerSide = () => typeof window === "undefined"

interface DarkModeConfig {
  classNameDark?: string // A className to set "dark mode". Default = "dark-mode".
  classNameLight?: string // A className to set "light mode". Default = "light-mode".
  element?: HTMLElement | undefined | null // The element to apply the className. Default = `document.body`
  storageKey?: string // Specify the `localStorage` key. Default = "darkMode". set to `undefined` to disable persistent storage.
}

const useDarkModeInternal = (
  initialState: boolean | undefined,
  options: DarkModeConfig,
) => {
  const {
    classNameDark = "dark",
    classNameLight = "light",
    storageKey,
    element,
  } = options

  const [darkMode, setDarkMode] = useState(initialState)

  useEffect(() => {
    const presentedDarkMode = storageKey
      ? isServerSide()
        ? undefined
        : getStorage(storageKey)
      : undefined

    if (presentedDarkMode !== undefined) {
      if (presentedDarkMode === "true") {
        setDarkMode(true)
      } else if (presentedDarkMode === "false") {
        setDarkMode(false)
      }
    } else if (typeof initialState === "undefined") {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
    }
  }, [storageKey])

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => {
      const storageValue = getStorage(storageKey || "darkMode")
      if (storageValue === undefined) {
        setDarkMode(e.matches)
      }
    }

    const focusHandler = () => {
      const storageValue = getStorage(storageKey || "darkMode")
      if (storageValue === undefined) {
        setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    window.addEventListener("focus", focusHandler)
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handler)

    return () => {
      window.removeEventListener("focus", focusHandler)
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handler)
    }
  }, [storageKey])

  useEffect(() => {
    if (isServerSide() || typeof darkMode === "undefined") {
      return
    }

    const $el = element || document.documentElement
    if (darkMode) {
      $el.classList.remove(classNameLight)
      $el.classList.add(classNameDark)
    } else {
      $el.classList.remove(classNameDark)
      $el.classList.add(classNameLight)
    }
  }, [classNameDark, classNameLight, darkMode, element])

  if (isServerSide()) {
    return {
      toggle: () => {},
      value: false,
    }
  }

  return {
    value: darkMode,
    toggle: () => {
      setDarkMode((d) => {
        if (storageKey && !isServerSide()) {
          setStorage(storageKey, String(!d))
        }

        return !d
      })
    },
  }
}

const noop = () => {}

const mockElement = {
  classList: {
    add: noop,
    remove: noop,
  },
}
const darkModeKey = "darkMode"
export const useDarkMode = () => {
  const { toggle, value } = useDarkModeInternal(getStorage(darkModeKey), {
    classNameDark: "dark",
    classNameLight: "light",
    storageKey: darkModeKey,
    element: (globalThis.document && document.documentElement) || mockElement,
  })

  useEffect(() => {
    useMediaStore.setState({
      isDark: value,
    })
  }, [value])

  const onceRef = useRef(false)
  if (!onceRef.current) {
    onceRef.current = true
    useMediaStore.setState({ toggle })
  }

  useEffect(() => {
    const handler = () => {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches === value) {
        delStorage(darkModeKey)
      }
    }
    window.addEventListener("beforeunload", handler)

    return () => {
      window.removeEventListener("beforeunload", handler)
    }
  }, [value])

  return {
    toggle,
    value,
  }
}

export const useIsDark = () => useMediaStore((state) => state.isDark)

export const useDarkModeSwitch = () => {
  return useMediaStore((state) => state.toggle)
}
