export const API_BASE = "https://api.antoniu.xyz/api";
export const FILE_BASE = "https://api.antoniu.xyz";

export async function apiFetch(path, options = {}, token = "") {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" && (data?.error || data?.message)) ||
      "Request failed";
    throw new Error(message);
  }

  return data;
}
