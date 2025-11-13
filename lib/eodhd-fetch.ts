interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
  backoff?: number
}

export class EODHDError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "EODHDError"
  }
}

export async function eodhdFetch(url: string, options: FetchOptions = {}): Promise<any> {
  const { timeout = 7000, retries = 3, backoff = 500, ...fetchOptions } = options

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new EODHDError(`HTTP ${response.status}: ${response.statusText}`, response.status)
        }
        throw new EODHDError(`API error: ${response.status}`, response.status)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error

      if (
        attempt < retries &&
        ((error instanceof EODHDError && (error.status === 429 || (error.status && error.status >= 500))) ||
          error.name === "AbortError" ||
          error.message.includes("fetch"))
      ) {
        await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, attempt)))
        continue
      }

      break
    }
  }

  throw lastError
}
