import Web3 from 'web3';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import IPFS from 'ipfs-http-client';

// Smart contract ABIs
import PetNFTContract from '../contracts/PetNFTContract.json';
import MarketplaceContract from '../contracts/MarketplaceContract.json';
import AccessoryContract from '../contracts/AccessoryContract.json';

class BlockchainSystem {
  constructor() {
    this.web3 = null;
    this.ipfs = null;
    this.provider = null;
    this.signer = null;
    this.contracts = new Map();
    this.userWallet = null;
    this.nftCache = new Map();
    this.marketplaceCache = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Web3
      this.provider = new ethers.providers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL
      );
      
      // Initialize IPFS
      this.ipfs = IPFS.create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https'
      });

      // Load contract addresses
      await this.loadContracts();

      // Load cached data
      await this.loadCache();

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing BlockchainSystem:', error);
    }
  }

  async loadContracts() {
    try {
      // Initialize contracts
      this.contracts.set('PetNFT', new ethers.Contract(
        process.env.PET_NFT_CONTRACT_ADDRESS,
        PetNFTContract.abi,
        this.provider
      ));

      this.contracts.set('Marketplace', new ethers.Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS,
        MarketplaceContract.abi,
        this.provider
      ));

      this.contracts.set('Accessory', new ethers.Contract(
        process.env.ACCESSORY_CONTRACT_ADDRESS,
        AccessoryContract.abi,
        this.provider
      ));
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  }

  async loadCache() {
    try {
      const nftCache = await AsyncStorage.getItem('nft_cache');
      if (nftCache) {
        this.nftCache = new Map(JSON.parse(nftCache));
      }

      const marketplaceCache = await AsyncStorage.getItem('marketplace_cache');
      if (marketplaceCache) {
        this.marketplaceCache = new Map(JSON.parse(marketplaceCache));
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  }

  setupEventListeners() {
    // Listen for NFT transfers
    const petNFTContract = this.contracts.get('PetNFT');
    petNFTContract.on('Transfer', (from, to, tokenId) => {
      this.handleNFTTransfer(from, to, tokenId);
    });

    // Listen for marketplace events
    const marketplaceContract = this.contracts.get('Marketplace');
    marketplaceContract.on('ItemListed', (tokenId, seller, price) => {
      this.handleItemListed(tokenId, seller, price);
    });
  }

  // Wallet Management
  async connectWallet(privateKey) {
    try {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.userWallet = this.signer.address;

      // Connect contracts to signer
      this.contracts.forEach(contract => {
        contract.connect(this.signer);
      });

      return this.userWallet;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // NFT Minting
  async mintPetNFT(petData) {
    try {
      if (!this.signer) throw new Error('Wallet not connected');

      // Upload metadata to IPFS
      const metadata = await this.uploadMetadataToIPFS(petData);

      // Mint NFT
      const petNFTContract = this.contracts.get('PetNFT');
      const tx = await petNFTContract.mintPet(
        this.userWallet,
        metadata.path,
        petData.attributes
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events[0].args.tokenId.toString();

      // Cache NFT data
      this.nftCache.set(tokenId, {
        ...petData,
        metadata: metadata.path,
        owner: this.userWallet
      });

      await this.updateCache();

      return tokenId;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  async uploadMetadataToIPFS(data) {
    try {
      // Prepare metadata
      const metadata = {
        name: data.name,
        description: data.description,
        image: data.image,
        attributes: data.attributes,
        timestamp: new Date().toISOString()
      };

      // Upload to IPFS
      const result = await this.ipfs.add(JSON.stringify(metadata));
      return result;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  // Marketplace Functions
  async listNFTForSale(tokenId, price) {
    try {
      if (!this.signer) throw new Error('Wallet not connected');

      const marketplaceContract = this.contracts.get('Marketplace');
      const petNFTContract = this.contracts.get('PetNFT');

      // Approve marketplace contract
      await petNFTContract.approve(marketplaceContract.address, tokenId);

      // List item
      const tx = await marketplaceContract.listItem(tokenId, price);
      await tx.wait();

      // Update marketplace cache
      this.marketplaceCache.set(tokenId, {
        seller: this.userWallet,
        price,
        listed: true
      });

      await this.updateCache();
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }

  async purchaseNFT(tokenId) {
    try {
      if (!this.signer) throw new Error('Wallet not connected');

      const listing = this.marketplaceCache.get(tokenId);
      if (!listing) throw new Error('Item not found');

      const marketplaceContract = this.contracts.get('Marketplace');
      const tx = await marketplaceContract.purchaseItem(tokenId, {
        value: listing.price
      });

      await tx.wait();

      // Update caches
      this.marketplaceCache.delete(tokenId);
      this.nftCache.set(tokenId, {
        ...this.nftCache.get(tokenId),
        owner: this.userWallet
      });

      await this.updateCache();
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      throw error;
    }
  }

  // Accessory NFTs
  async mintAccessory(accessoryData) {
    try {
      if (!this.signer) throw new Error('Wallet not connected');

      const metadata = await this.uploadMetadataToIPFS(accessoryData);
      const accessoryContract = this.contracts.get('Accessory');

      const tx = await accessoryContract.mintAccessory(
        this.userWallet,
        metadata.path,
        accessoryData.attributes
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events[0].args.tokenId.toString();

      return tokenId;
    } catch (error) {
      console.error('Error minting accessory:', error);
      throw error;
    }
  }

  async equipAccessory(petTokenId, accessoryTokenId) {
    try {
      if (!this.signer) throw new Error('Wallet not connected');

      const petNFTContract = this.contracts.get('PetNFT');
      const tx = await petNFTContract.equipAccessory(petTokenId, accessoryTokenId);
      await tx.wait();

      // Update NFT cache
      const petData = this.nftCache.get(petTokenId);
      if (petData) {
        petData.equippedAccessories = [
          ...(petData.equippedAccessories || []),
          accessoryTokenId
        ];
        this.nftCache.set(petTokenId, petData);
        await this.updateCache();
      }
    } catch (error) {
      console.error('Error equipping accessory:', error);
      throw error;
    }
  }

  // Event Handlers
  async handleNFTTransfer(from, to, tokenId) {
    // Update NFT ownership in cache
    const nftData = this.nftCache.get(tokenId);
    if (nftData) {
      nftData.owner = to;
      this.nftCache.set(tokenId, nftData);
      await this.updateCache();
    }

    DeviceEventEmitter.emit('nftTransferred', {
      tokenId,
      from,
      to
    });
  }

  async handleItemListed(tokenId, seller, price) {
    this.marketplaceCache.set(tokenId, {
      seller,
      price: price.toString(),
      listed: true
    });

    await this.updateCache();

    DeviceEventEmitter.emit('itemListed', {
      tokenId,
      seller,
      price: price.toString()
    });
  }

  // Cache Management
  async updateCache() {
    try {
      await AsyncStorage.setItem(
        'nft_cache',
        JSON.stringify(Array.from(this.nftCache.entries()))
      );

      await AsyncStorage.setItem(
        'marketplace_cache',
        JSON.stringify(Array.from(this.marketplaceCache.entries()))
      );
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }

  // Utility Functions
  async getNFTMetadata(tokenId) {
    try {
      const petNFTContract = this.contracts.get('PetNFT');
      const uri = await petNFTContract.tokenURI(tokenId);
      
      // Fetch from IPFS
      const metadata = await fetch(`https://ipfs.io/ipfs/${uri}`);
      return metadata.json();
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      throw error;
    }
  }

  async getOwnedNFTs() {
    try {
      if (!this.userWallet) throw new Error('Wallet not connected');

      const petNFTContract = this.contracts.get('PetNFT');
      const balance = await petNFTContract.balanceOf(this.userWallet);
      
      const ownedNFTs = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await petNFTContract.tokenOfOwnerByIndex(
          this.userWallet,
          i
        );
        const metadata = await this.getNFTMetadata(tokenId);
        ownedNFTs.push({ tokenId, metadata });
      }

      return ownedNFTs;
    } catch (error) {
      console.error('Error fetching owned NFTs:', error);
      throw error;
    }
  }
}

export default new BlockchainSystem();
