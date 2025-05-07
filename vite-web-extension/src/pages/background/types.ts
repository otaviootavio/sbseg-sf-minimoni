export interface ChannelData {
  chainId: string;
  vendorAddress: string;
  amountPerHash: string;
  numHashes: string;
  contractAddress: string;
  totalAmount: string;
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


export interface PublicHashchainData extends Omit<HashchainData, 'secret' | 'hashes'> {
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
