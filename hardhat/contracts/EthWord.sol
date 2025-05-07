// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EthWord is ReentrancyGuard {
    address payable public channelSender;
    address payable public channelRecipient;
    uint public totalWordCount;
    bytes32 public channelTip;

    constructor(address to, uint wordCount, bytes32 tip) payable {
        require(to != address(0), "Recipient cannot be the zero address");
        require(wordCount > 0, "Word count must be positive");
        require(tip != 0, "Initial tip cannot be zero");

        channelRecipient = payable(to);
        channelSender = payable(msg.sender);
        totalWordCount = wordCount;
        channelTip = tip;
    }

    function closeChannel(bytes32 _word, uint _wordCount) public nonReentrant {
        require(
            msg.sender == channelRecipient,
            "Only the recipient can close the channel"
        );
        require(
            _wordCount <= totalWordCount,
            "Word count exceeds available words"
        );
        bool isValid = validateChannelClosure(_word, _wordCount);
        require(isValid, "Word or WordCount not valid!");

        uint amountToWithdraw = calculateWithdrawAmount(_wordCount);

        (bool sent, ) = channelRecipient.call{value: amountToWithdraw}("");
        require(sent, "Failed to send Ether");

        channelTip = _word;
        totalWordCount = totalWordCount - _wordCount;
    }

    function validateChannelClosure(
        bytes32 _word,
        uint _wordCount
    ) private view returns (bool) {
        if (_wordCount == 0) {
            return false;
        }
        bytes32 wordScratch = keccak256(abi.encodePacked(_word));

        for (uint i = 1; i < _wordCount; i++) {
            wordScratch = keccak256(abi.encodePacked(wordScratch));
        }
        return wordScratch == channelTip;
    }

    function calculateWithdrawAmount(
        uint _wordCount
    ) private view returns (uint) {
        uint remainingWords = totalWordCount - _wordCount;
        if (remainingWords == 0) {
            return address(this).balance;
        }
        uint initialWordPrice = address(this).balance / totalWordCount;
        return initialWordPrice * _wordCount;
    }
}
