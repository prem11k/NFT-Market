// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address NFTMarketContract;

    constructor(address marketPlaceAddress) ERC721("MintNFT Tokens", "MINT") {
        NFTMarketContract = marketPlaceAddress;
    }

    function createToken(string memory tokenURI) public returns(uint) {
        _tokenIds.increment();
        uint newItemId = _tokenIds.current();
        
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(NFTMarketContract, true);
        return newItemId;
    }
}