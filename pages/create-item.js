import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

import { nftAddress, nftMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0' ) // {host:'127.0.0.1', port: '8080', protocol: 'https'}

export default function CreateNFT() {
    const [fileURL, setFileURL] = useState(null);
    const [formInput, updateFormInput] = useState({ name: '', description: '', price: '' });
    const router = useRouter();

    const onChange = async (e) => {
        const file = e.target.files[0];
        try {
            const added = await client.add(
                file,
                {
                  progress: (prog) => console.log(`received: ${prog}`)
                }
              )
              const url = `https://ipfs.infura.io/ipfs/${added.path}`
            setFileURL(url);
        } catch (e) {
            console.log("Error uploading file: ",e);
        }
    }

    const createNFT = async () => {
        const {name, description, price } = formInput;
        if (!name || !description || !price) return;
        const data = JSON.stringify(
            {name, description, image: fileURL}
        );
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            createSale(url);
        } catch (e) {
            console.log("Error uploading file: ", e);
        }
    }

    const createSale = async (url) => {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider =  new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
        let transaction = await contract.createToken(url);
        let tx = await transaction.wait();

        let events = tx.events[0];
        let value = events.args[2];
        let tokenId = value.toNumber();
        let price = ethers.utils.parseUnits(formInput.price, 'ether');

        contract = new ethers.Contract(nftMarketAddress, NFTMarket.abi, signer);
        let fee = await contract.getFee();
        fee = fee.toString();
        
        transaction = await contract.createMarketItem(
            nftAddress, tokenId, price, { value: fee }
        );
        await transaction.wait();

        router.push('/');
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    className="mt-8 border rounded p-4"
                    placeholder="NFT name"
                    onChange={e => updateFormInput({...formInput, name: e.target.value})}
                />
                <textarea
                    className="mt-2 border rounded p-4"
                    placeholder="Descripton"
                    onChange={e => updateFormInput({...formInput, description: e.target.value})}
                />
                <input
                    className="mt-2 border rounded p-4"
                    placeholder="Price in Matic"
                    onChange={e => updateFormInput({...formInput, price: e.target.value})}
                />
                <input
                    className="my-4"
                    type="file"
                    name="thumbnail"
                    onChange={onChange}
                />
                {
                    fileURL && 
                    <img className="rounded mt-4" width="350" src={fileURL}/>
                }
                <button
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                    onClick={createNFT}
                >Create your asset</button>
            </div>
        </div>
    );
}
