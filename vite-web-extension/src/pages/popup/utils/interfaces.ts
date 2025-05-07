export interface HashObject {
  chainId: number;
  address_contract: string;
  address_to: string;
  length: number;
  amountEthInWei: bigint;
  hashchain: `0x${string}`[];
  isValid: boolean;
  key: string;
  tail: `0x${string}`;
  secret: string;
  indexOfLastHashSend: number;
}

export interface MessageData {
  type: string;
  data: HashObject;
}
export interface Message {
  action: string;
  data: HashObject;
}

export interface event {
  data: MessageData;
}

export type HashObjectWithoutKey = Omit<HashObject, "key">;
