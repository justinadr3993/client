// client/src/services/api/usersApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../../utils/apiUtils";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User", "Staff"],
  endpoints: (builder) => ({
    fetchUsers: builder.query({
      query: ({ page, limit } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (limit) params.append("limit", limit);
        return `/users?${params.toString()}`;
      },
      providesTags: ["User", "Staff"],
    }),
    fetchUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: ["User", "Staff"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["User", "Staff"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Staff"],
    }),
    changePassword: builder.mutation({
      query: ({ id, currentPassword, newPassword }) => ({
        url: `/users/${id}/password`,
        method: "PATCH",
        body: { currentPassword, newPassword },
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useFetchUsersQuery,
  useFetchUserByIdQuery,
  useLazyFetchUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangePasswordMutation,
} = usersApi;