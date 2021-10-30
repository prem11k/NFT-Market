import { ethers } from "ethers";
import { useEffect, useState } from "react";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function MyNFTS() {
    const [nfts, setNFTs] = useState([]);
    const [loadingState, setLoadingState] = useState(true);

    const loadNFTs = async () => {

        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        console.log(signer);
        const tokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);
        const marketContract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        const data = await marketContract.fetchMyNFTs(true);

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
        // console.log(items);
        setNFTs(items);
        setLoadingState(false);
    }
    useEffect(() => {
        loadNFTs();
    }, []);
    if (!loadingState && !nfts.length) {
        return (
          <h1 className="px-20 py-10 text-3xl">Sorry! No NFTs owned</h1>
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
                    </div>
                  </div>
                ))
              }
            </div>
    
          </div>
        </div>
      );
}