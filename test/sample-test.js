const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT market", function () {
  it("Should create and sell NFTs", async function () {
    const Market = await ethers.getContractFactory('NFTMarket');
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;
    console.log("marketAdress", marketAddress);

    const NFT = await ethers.getContractFactory('NFT');
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftAddress = nft.address;

    let fee = await market.getFee();
    fee = fee.toString();

    const basePrice = ethers.utils.parseUnits('100', 'ether');

    await nft.createToken("https:\\www.tokens.com");
    await nft.createToken("https:\\www.tokens2.com");

    await market.createMarketItem(nftAddress, 1, basePrice, {value: fee});
    await market.createMarketItem(nftAddress, 2, basePrice, {value: fee});

    const [_, firstAddress, secAddress] = await ethers.getSigners();
    const prov = ethers.provider;

    const balance = await prov.getBalance(firstAddress.address);

    await market.connect(firstAddress).sellNFT(nftAddress, 1, {value: basePrice});

    let items = await market.fetchNFTs(false);
    items = await Promise.all(items.map(async i => {
      const tokenURI = await nft.tokenURI(i.tokenId);
      item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI: tokenURI
      }
      return item;
    }));
    console.log(items);
    
  });
});
