import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  const [nfts, setNFTs] = useState([]);
  const [loadingState, setLoadingState] = useState(true);

  const loadNFTs =  async () => {
    console.log(loadingState);
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, provider);
    const data = await marketContract.fetchNFTs(false);

    const items = await Promise.all(data.map(async i => {
      const tokenURI = await tokenContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenURI); // http://ifp......
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description
      }

      return item;
    }))
    console.log(items);
    setNFTs(items);
    setLoadingState(false);
  }

  const buyNFT = async (nft) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
    const bal = await signer.getBalance();
    console.log(await signer.getAddress(), ethers.utils.parseUnits(bal.toString(), 'ether'));
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    console.log(price, nft.price.toString());
    const transaction = await contract.sellNFT(nftAddress, nft.tokenId, {value: price});
    await transaction.wait();
    loadNFTs();
  }
  useEffect(() => {
    loadNFTs();
  }, []);

  if (!loadingState && !nfts.length) {
    return (
      <h1 className="px-20 py-10 text-3xl">Oops! No NFTs available</h1>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{maxWidth: '1600px'}}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key= {i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image}/>
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} Matic</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-2
                  rounded" onClick={()=> buyNFT(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  );
}
