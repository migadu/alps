export async function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}, timeoutMs: number = 25000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      window.dispatchEvent(new CustomEvent('network-error'));
    }
    return response;
  } catch (error) {
    if (error instanceof TypeError || (error as Error).name === 'AbortError') {
      window.dispatchEvent(new CustomEvent('network-error'));
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
