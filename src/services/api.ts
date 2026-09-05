/**
 * Shared API helper that attaches auth token to all requests.
 * Import this in any file that needs to call the backend.
 */

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("bharat_token");
  }
  return null;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("bharat_token");
    localStorage.removeItem("bharat_user");
    window.location.reload();
    throw new Error("Session expired. Please login again.");
  }

  return res;
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const res = await apiFetch(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await apiFetch(url, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}
