import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { vendorApi, channelApi, paymentApi } from "../../clients/api";
import {
  VendorResponse,
  ChannelListResponse,
  PaymentListResponse,
  ErrorResponse,
  ChannelDataSchema
} from "../../clients/schemas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import VendorInfoCard from "./VendorInfoCard";
import ChannelList from "./ChannelList";
import CloseChannelModal from "./CloseChannelModal";
import { z } from 'zod';
import { type Hash } from 'viem';

interface VendorAdminPanelProps {
  // Add any props if needed
}

const VendorAdminPanel: React.FC<VendorAdminPanelProps> = () => {
  const { address, isConnected } = useAccount();
  const [vendorData, setVendorData] = useState<
    VendorResponse | ErrorResponse | null
  >(null);
  const [channelsData, setChannelsData] = useState<
    ChannelListResponse | ErrorResponse | null
  >(null);
  const [paymentsData, setPaymentsData] = useState<
    Record<string, PaymentListResponse | ErrorResponse | null>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPayments, setLoadingPayments] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<z.infer<typeof ChannelDataSchema> | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (isConnected && address) {
        setLoading(true);
        setError(null);
        setVendorData(null);
        setChannelsData(null);
        setPaymentsData({});
        setLoadingPayments({});

        try {
          const vendorResult = await vendorApi.getVendorByAddress(address);
          setVendorData(vendorResult);

          if (vendorResult.success) {
            const channelsResult = await channelApi.listChannelsByVendor(
              vendorResult.data.id
            );
            setChannelsData(channelsResult);

            if (channelsResult.success) {
              const initialLoadingPayments: Record<string, boolean> = {};
              channelsResult.data.forEach((channel) => {
                initialLoadingPayments[channel.id] = true;
              });
              setLoadingPayments(initialLoadingPayments);

              channelsResult.data.forEach((channel) => {
                fetchPaymentsForChannel(channel.id);
              });
            } else {
              setError(channelsResult.message || "Failed to fetch channels.");
            }
          } else {
            setError(
              vendorResult.message ||
                "Vendor not found or failed to fetch vendor data."
            );
          }
        } catch (err: any) {
          console.error("Error fetching vendor data:", err);
          setError(err.message || "An unexpected error occurred.");
          setVendorData({
            success: false,
            message: err.message || "An unexpected error occurred.",
          });
        } finally {
          setLoading(false);
        }
      } else {
        setVendorData(null);
        setChannelsData(null);
        setPaymentsData({});
        setLoading(false);
        setError("Please connect your wallet.");
      }
    };

    fetchVendorData();
  }, [address, isConnected]);

  const fetchPaymentsForChannel = async (channelId: string) => {
    try {
      const paymentsResult = await paymentApi.listPaymentsByChannel(channelId);
      setPaymentsData((prev) => ({ ...prev, [channelId]: paymentsResult }));
    } catch (err: any) {
      console.error(`Error fetching payments for channel ${channelId}:`, err);
      setPaymentsData((prev) => ({
        ...prev,
        [channelId]: {
          success: false,
          message: err.message || "Failed to fetch payments.",
        },
      }));
    } finally {
      setLoadingPayments((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  const handleCloseChannelClick = (channelId: string) => {
    if (channelsData && channelsData.success) {
       const channelToClose = channelsData.data.find(ch => ch.id === channelId);
       if (channelToClose) {
         setSelectedChannel(channelToClose);
         setIsModalOpen(true);
       }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedChannel(null);
  };

  const handleCloseSuccess = async (channelId: string, txHash: Hash) => {
      console.log(`Channel ${channelId} close transaction mined: ${txHash}`);
      handleModalClose();

      try {
        const apiResult = await channelApi.closeChannel(channelId, { settlementTx: txHash });
        if (apiResult.success) {
            setChannelsData((prev) => {
            if (!prev || !prev.success) return prev;
            return {
                ...prev,
                data: prev.data.map((ch) =>
                ch.id === channelId ? { ...ch, status: "CLOSED", settlementTx: txHash } : ch
                ),
            };
            });
             alert("Channel status updated successfully on backend!");
        } else {
            console.error("API Error after closing channel:", apiResult.message);
            alert(`Transaction succeeded, but failed to update backend: ${apiResult.message}`);
        }
      } catch (err: any) {
          console.error("API Error calling closeChannel:", err);
          alert(`Transaction succeeded, but API call failed: ${err.message}`);
      }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm("Are you sure you want to delete this channel? This action cannot be undone.")) {
      return;
    }
    try {
      await channelApi.deleteChannel(channelId);
      setChannelsData((prev) => {
        if (!prev || !prev.success) return prev;
        return {
          ...prev,
          data: prev.data.filter((ch) => ch.id !== channelId),
        };
      });
      setPaymentsData(prev => {
        const newState = {...prev};
        delete newState[channelId];
        return newState;
      });
      setLoadingPayments(prev => {
        const newState = {...prev};
        delete newState[channelId];
        return newState;
      });
      alert("Channel deleted successfully!");
    } catch (err: any) {
      console.error(`Error deleting channel ${channelId}:`, err);
      const errorResponse = err.response?.data as ErrorResponse | undefined;
      const message = errorResponse?.message || err.message || "An unexpected error occurred while deleting the channel.";
      alert(`Error deleting channel: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Vendor Data...</span>
      </div>
    );
  }

  if (error && (!vendorData || !vendorData.success)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isConnected || !address) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Wallet Not Connected</AlertTitle>
        <AlertDescription>Please connect your wallet to view vendor details.</AlertDescription>
      </Alert>
    );
  }

  if (!vendorData || !vendorData.success) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Vendor Not Found</AlertTitle>
        <AlertDescription>No vendor data found for the connected address: {address}.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <VendorInfoCard vendor={vendorData.data} />

      <ChannelList
        channelsData={channelsData}
        paymentsData={paymentsData}
        onCloseChannelClick={handleCloseChannelClick}
        onDeleteChannel={handleDeleteChannel}
        loadingPayments={loadingPayments}
      />

      <CloseChannelModal
        channel={selectedChannel}
        payments={selectedChannel ? paymentsData[selectedChannel.id] || null : null}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleCloseSuccess}
      />
    </div>
  );
};

export default VendorAdminPanel;
