import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { handleTokenExpiration } from "./tokenUtils";

const API_URL = import.meta.env.VITE_API_URL;

export const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = handleTokenExpiration();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
