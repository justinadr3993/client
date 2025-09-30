import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../../utils/apiUtils";

export const stocksApi = createApi({
  reducerPath: "stocksApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Stock", "StockAnalytics", "StockHistory"],
  endpoints: (builder) => ({
    fetchStocks: builder.query({
      query: ({ page, limit } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (limit) params.append("limit", limit);
        return `/stocks?${params.toString()}`;
      },
      providesTags: ["Stock"],
    }),
    fetchStockById: builder.query({
      query: (id) => `/stocks/${id}`,
      providesTags: ["Stock"],
    }),
    createStock: builder.mutation({
      query: (newStock) => ({
        url: "/stocks",
        method: "POST",
        body: newStock,
      }),
      invalidatesTags: ["Stock", "StockAnalytics"],
    }),
    updateStock: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/stocks/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["Stock", "StockAnalytics"],
    }),
    deleteStock: builder.mutation({
      query: (id) => ({
        url: `/stocks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Stock", "StockAnalytics"],
    }),
    recordStockChange: builder.mutation({
      query: ({ id, change, operation }) => ({
        url: `/stocks/${id}/change`,
        method: "POST",
        body: { change, operation },
      }),
      invalidatesTags: ["Stock", "StockAnalytics", "StockHistory"],
    }),
    getStockAnalytics: builder.query({
      query: () => '/stocks/analytics',
      providesTags: ['StockAnalytics']
    }),
    getStockHistory: builder.query({
      query: (timeframe) => `/stocks/history?timeframe=${timeframe || 'month'}`,
      providesTags: ['StockHistory']
    }),
  }),
});

export const {
  useFetchStocksQuery,
  useFetchStockByIdQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useDeleteStockMutation,
  useRecordStockChangeMutation,
  useGetStockAnalyticsQuery,
  useGetStockHistoryQuery,
} = stocksApi;