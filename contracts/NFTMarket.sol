// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint fee = 0.05 ether;

    constructor(){
        owner = payable(msg.sender);
    }

    struct NFToken {
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    mapping (uint => NFToken) private idToToken;

    event MarketItemCreated(
        uint itemId,
        address nftContract,
        uint tokenId,
        address indexed seller,
        address indexed owner,
        uint price,
        bool sold
    );

    function getFee() public view returns (uint) {
        return fee;
    }

    function createMarketItem(
        address nftContract,
        uint tokenId,
        uint price
    ) public payable nonReentrant {
        require(price > 0, "Price must be aleast 1 wei");
        require(msg.value == fee, "insufficient fee");

        _itemIds.increment();
        uint itemId = _itemIds.current();

        idToToken[itemId] = NFToken(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            address(0),
            owner,
            price,
            false);
    }

    function sellNFT(
        address nftContract,
        uint itemId
    ) public payable nonReentrant{
        uint price = idToToken[itemId].price;
        uint tokenId = idToToken[itemId].tokenId;
        require(msg.value == price, "insufficient ether");

        idToToken[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        idToToken[itemId].owner = payable(msg.sender);
        idToToken[itemId].sold = true;
        _itemsSold.increment();

        payable(owner).transfer(fee);

    }

    function fetchNFTs(bool sold) public view returns (NFToken[] memory){
        uint itemCount = _itemIds.current();
        uint unSoldItemsCount = itemCount - _itemsSold.current();
        uint requiredNFTsCount = sold? _itemsSold.current() : unSoldItemsCount;
        uint index = 0;
        NFToken[] memory NFTs = new NFToken[](requiredNFTsCount);

        for (uint256 itemIndex = 0; itemIndex < itemCount; itemIndex++) {
            if(idToToken[itemIndex + 1].sold == sold){
                uint itemId = idToToken[itemIndex + 1].itemId;
                NFTs[index] = idToToken[itemId];
                index += 1;
            }
        }
        return NFTs;
    }

    function fetchMyNFTs(bool purchased) public view returns (NFToken[] memory) {
        uint totalItems = _itemIds.current();
        uint myNFTCount = 0;
        uint index = 0;
        NFToken memory nft;
        for (uint256 itemIndex = 0; itemIndex < totalItems; itemIndex++) {
            nft = idToToken[itemIndex + 1];
            if((purchased? nft.owner: nft.seller) == msg.sender){
                myNFTCount += 1;
            }
        }

        NFToken[] memory myNFTs = new NFToken[](myNFTCount);
        for (uint256 itemIndex = 0; itemIndex < myNFTCount; itemIndex++) {
            uint itemId = idToToken[itemIndex + 1].itemId;
            nft = idToToken[itemId];
            if((purchased? nft.owner: nft.seller) == msg.sender){
                myNFTs[index] = idToToken[itemIndex + 1];
                index += 1;
            }
        }
        return myNFTs;
    }
}