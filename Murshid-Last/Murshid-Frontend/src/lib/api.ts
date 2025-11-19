import { supabase } from "@/lib/supabase";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (!backendUrl) {
  throw new Error("Backend environment variable is missing. Please set VITE_BACKEND_URL.");
}

const baseUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);

  if (options.requireAuth !== false) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error("No Supabase session available. Please log in.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};



