export interface ChannelData {
  chainId: string;
  vendorAddress: string;
  amountPerHash: string;
  numHashes: string;
  contractAddress: string;
  totalAmount: string;
  tail: string;
}

export interface VendorInfoProps {
  channelData: ChannelData;
  vendorInfoFetched: boolean;
  onFetchVendorInfo: () => void;
}

export interface ChannelConfigProps {
  channelData: ChannelData;
  vendorInfoFetched: boolean;
  onHashCountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ContractDeploymentProps {
  channelData: ChannelData;
  vendorInfoFetched: boolean;
  onDeployContract: () => void;
}

export interface VendorDataPanelProps {
  channelData: ChannelData;
}

export interface HashStreamingProps {
  paymentMode: string;
  lastHashIndex: number;
  channelData: ChannelData;
  onPaymentModeChange: (mode: string) => void;
  onRequestHash: () => void;
}

export interface ChannelCloseProps {
  channelData: ChannelData;
  lastHashIndex: number;
}

export interface HashchainInfo {
  vendorAddress: string;
  chainId: string;
}

export type HashchainId = string;

export interface VendorData {
  vendorAddress: string;
  chainId: string;
  amountPerHash: string;
}

export interface HashchainData {
  vendorData: VendorData;
  secret: string;
  hashes: string[];
  lastIndex: number;
  contractAddress?: string;
  numHashes?: string;
  totalAmount?: string;
  createdAt: number;
  tail: string;
}

export interface StorageData {
  hashchains: {
    [hashchainId: HashchainId]: HashchainData;
  };
  selectedHashchainId: HashchainId | null;
}

export interface PublicHashchainData
  extends Omit<HashchainData, "secret" | "hashes"> {
  hasSecret: boolean;
}

export interface ImportHashchainData {
  chainId: string;
  contractAddress: string;
  vendorData: VendorData;
  hash: string;
  lastIndex: number;
  numHashes: string;
  totalAmount: string;
}
