import axios, { AxiosInstance } from "axios";
import {
  ChannelCreateRequestSchema,
  ChannelCreateByVendorAddressSchema,
  ChannelUpdateRequestSchema,
  ChannelListResponseSchema,
  ChannelResponseSchema,
  ChannelDeleteResponseSchema,
  VendorCreateRequestSchema,
  VendorListResponseSchema,
  VendorResponseSchema,
  VendorUpdateRequestSchema,
  ErrorResponseSchema,
  CloseChannelRequestSchema,
  PaymentResponseSchema,
  PaymentVerifyHashResponseSchema,
  PaymentListResponseSchema,
  PaymentCreateRequestSchema,
} from "./schemas";
import { z } from "zod";

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  transformResponse: [
    (data) => {
      // Ensure the response is parsed as JSON if it's a string
      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    },
  ],
});

// Error handling helper
const handleError = (error: any) => {
  if (axios.isAxiosError(error)) {
    // If the error response is a string, try to parse it
    let errorData = error.response?.data;
    if (typeof errorData === "string") {
      try {
        errorData = JSON.parse(errorData);
      } catch (e) {
        // If parsing fails, create a standard error response
        errorData = {
          success: false,
          message: errorData || "An unknown error occurred",
        };
      }
    }
    return ErrorResponseSchema.parse(errorData);
  }
  throw error;
};

export const vendorApi = {
  createVendor: async (data: z.infer<typeof VendorCreateRequestSchema>) => {
    try {
      const response = await apiClient.post("/api/vendors", data);
      return VendorResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listVendors: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await apiClient.get("/api/vendors", {
        params: { page, limit },
      });
      return VendorListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  getVendor: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/vendors/${id}`);

      const responseData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      return VendorResponseSchema.parse(responseData);
    } catch (error) {
      console.error("Vendor fetch error:", error);
      return handleError(error);
    }
  },

  getVendorByAddress: async (address: string) => {
    try {
      const response = await apiClient.get(`/api/vendors/by-address/${address}`);
      return VendorResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  updateVendor: async (
    id: string,
    data: z.infer<typeof VendorUpdateRequestSchema>
  ) => {
    try {
      const response = await apiClient.put(`/api/vendors/${id}`, data);
      return VendorResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },
};

// Channel API
export const channelApi = {
  createChannel: async (data: z.infer<typeof ChannelCreateRequestSchema>) => {
    try {
      const response = await apiClient.post("/api/channels", data);
      return ChannelResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  createChannelbyVendorAddress: async (data: z.infer<typeof ChannelCreateByVendorAddressSchema>) => {
    try {
      const response = await apiClient.post("/api/channels/by-vendor-address", data);
      return ChannelResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listChannels: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await apiClient.get("/api/channels", {
        params: { page, limit },
      });
      return ChannelListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  getChannel: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/channels/${id}`);
      return ChannelResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  updateChannel: async (
    id: string,
    data: z.infer<typeof ChannelUpdateRequestSchema>
  ) => {
    try {
      const response = await apiClient.put(`/api/channels/${id}`, data);
      return ChannelResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteChannel: async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/channels/${id}`);
      return ChannelDeleteResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listChannelsByVendor: async (
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await apiClient.get(
        `/api/vendors/${vendorId}/channels`,
        {
          params: { page, limit },
        }
      );
      return ChannelListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listChannelsBySender: async (
    sender: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await apiClient.get(
        `/api/senders/${sender}/channels`,
        {
          params: { page, limit },
        }
      );
      return ChannelListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  closeChannel: async (
    channelId: string,
    data?: z.infer<typeof CloseChannelRequestSchema>
  ) => {
    try {
      const response = await apiClient.post(
        `/api/channels/${channelId}/close`,
        data || {}
      );
      return ChannelResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },
};

export const paymentApi = {
  createPayment: async (data: z.infer<typeof PaymentCreateRequestSchema>) => {
    try {
      const response = await apiClient.post("/api/payments", data);
      return PaymentResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listPayments: async (page: number = 1, limit: number = 10) => {
    try {
      const response = await apiClient.get("/api/payments", {
        params: { page, limit },
      });
      return PaymentListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  getPayment: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/payments/${id}`);
      return PaymentResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listPaymentsByVendor: async (
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await apiClient.get(
        `/api/vendors/${vendorId}/payments`,
        {
          params: { page, limit },
        }
      );
      return PaymentListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listPaymentsByChannel: async (
    channelId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await apiClient.get(
        `/api/channels/${channelId}/payments`,
        {
          params: { page, limit },
        }
      );
      return PaymentListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  listPaymentsBySmartContract: async (
    smartContractAddress: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await apiClient.get(
        `/api/payments/contract/${smartContractAddress}`,
        {
          params: { page, limit },
        }
      );
      return PaymentListResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  verifyHash: async (xHash: string, channelId: string) => {
    try {
      const response = await apiClient.post(`/api/payments/verify-hash`, {
        xHash,
        channelId,
      });
      return PaymentVerifyHashResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },

  getLatestPaymentBySmartContractAddress: async (
    smartContractAddress: string
  ) => {
    try {
      const response = await apiClient.get(
        `/api/payments/contract/${smartContractAddress}/latest`
      );

      return PaymentResponseSchema.parse(response.data);
    } catch (error) {
      return handleError(error);
    }
  },
};
