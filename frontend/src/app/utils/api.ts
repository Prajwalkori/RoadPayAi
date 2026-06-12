const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface UserToken {
  access_token: string;
  token_type: string;
  role: string;
  email: string;
  name: string;
  id: number;
}

export function saveToken(token: UserToken) {
  if (typeof window !== "undefined") {
    localStorage.setItem("roadpay_token", JSON.stringify(token));
  }
}

export function getToken(): UserToken | null {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("roadpay_token");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("roadpay_token");
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const tokenObj = getToken();
  
  const headers = new Headers(options.headers || {});
  
  if (tokenObj && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tokenObj.access_token}`);
  }
  
  // Do not set Content-Type if we're sending FormData (e.g. file upload or Form)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  const config = {
    ...options,
    headers,
  };
  
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/" && window.location.pathname !== "/register") {
       window.location.href = "/login";
    }
  }
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Request failed");
  }
  
  if (response.status === 204) {
    return null;
  }

  // Read as text first — calling .json() on an empty or HTML body throws
  // "Unexpected end of JSON input" which is very hard to debug
  const text = await response.text();
  if (!text || !text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    console.error("API returned non-JSON body:", text.slice(0, 300));
    throw new Error("Server returned an invalid response. Please try again.");
  }
}

export function getFileUrl(path: string): string {
  // If absolute path like app/data/uploads/abc.png, convert to http://localhost:8000/uploads/abc.png
  if (!path) return "";
  const cleaned = path.replace(/\\/g, "/");
  if (cleaned.includes("app/data/uploads/")) {
    return `http://localhost:8000/uploads/${cleaned.split("app/data/uploads/")[1]}`;
  }
  if (cleaned.includes("app/data/challans/")) {
    return `http://localhost:8000/challans/${cleaned.split("app/data/challans/")[1]}`;
  }
  return path;
}
