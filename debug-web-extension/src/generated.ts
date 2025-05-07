import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EthWord
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ethWordAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'wordCount', internalType: 'uint256', type: 'uint256' },
      { name: 'tip', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'payable',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'function',
    inputs: [],
    name: 'channelRecipient',
    outputs: [{ name: '', internalType: 'address payable', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'channelSender',
    outputs: [{ name: '', internalType: 'address payable', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'channelTip',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_word', internalType: 'bytes32', type: 'bytes32' },
      { name: '_wordCount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'closeChannel',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalWordCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ReentrancyGuard
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const reentrancyGuardAbi = [
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ethWordAbi}__
 */
export const useReadEthWord = /*#__PURE__*/ createUseReadContract({
  abi: ethWordAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"channelRecipient"`
 */
export const useReadEthWordChannelRecipient =
  /*#__PURE__*/ createUseReadContract({
    abi: ethWordAbi,
    functionName: 'channelRecipient',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"channelSender"`
 */
export const useReadEthWordChannelSender = /*#__PURE__*/ createUseReadContract({
  abi: ethWordAbi,
  functionName: 'channelSender',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"channelTip"`
 */
export const useReadEthWordChannelTip = /*#__PURE__*/ createUseReadContract({
  abi: ethWordAbi,
  functionName: 'channelTip',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"totalWordCount"`
 */
export const useReadEthWordTotalWordCount = /*#__PURE__*/ createUseReadContract(
  { abi: ethWordAbi, functionName: 'totalWordCount' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link ethWordAbi}__
 */
export const useWriteEthWord = /*#__PURE__*/ createUseWriteContract({
  abi: ethWordAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"closeChannel"`
 */
export const useWriteEthWordCloseChannel = /*#__PURE__*/ createUseWriteContract(
  { abi: ethWordAbi, functionName: 'closeChannel' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link ethWordAbi}__
 */
export const useSimulateEthWord = /*#__PURE__*/ createUseSimulateContract({
  abi: ethWordAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link ethWordAbi}__ and `functionName` set to `"closeChannel"`
 */
export const useSimulateEthWordCloseChannel =
  /*#__PURE__*/ createUseSimulateContract({
    abi: ethWordAbi,
    functionName: 'closeChannel',
  })
