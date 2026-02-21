export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor (message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
};

export const apiFetch = async <T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => {
  const res = await fetch(input, init);

  let data: any = null;
  try {
    data = await res.json();
  }
  catch {}

  if (!res.ok) {
    let message = "Request failed";

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((d: any) => d.msg ?? JSON.stringify(d))
        .join(", ");
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    }

    throw new ApiError(message, res.status, data);
  }

  return data as T;
};