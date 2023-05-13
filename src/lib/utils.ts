import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T // from lodash

export function truthy<T>(value: T): value is Truthy<T> {
  return Boolean(value)
}

export function stripHTML(html: string) {
  return html.replace(/<(?:.|\n)*?>/gm, "")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key]
    }
    return acc
  }, {} as Pick<T, K>)
}

export const isServerSide = () => typeof window === "undefined"

export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean
  return function () {
    const args = arguments
    // @ts-ignore
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const calculateElementTop = (el: HTMLElement) => {
  let top = 0
  while (el) {
    top += el.offsetTop
    el = el.offsetParent as HTMLElement
  }
  return top
}

export function last<T>(array: T[]): T | undefined {
  const length = array == null ? 0 : array.length
  return length ? array[length - 1] : undefined
}
