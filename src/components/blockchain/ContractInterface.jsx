import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Card, Typography, Button, CircularProgress } from '@mui/material';
import PetNFTContract from '../../contracts/PetNFTContract.sol';
import MarketplaceContract from '../../contracts/MarketplaceContract.sol';

const ContractCard = styled(Card)(({ theme }) => ({
  background: 'rgba(36, 38, 41, 0.9)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  border: '1px solid rgba(127, 90, 240, 0.2)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    border: '1px solid rgba(127, 90, 240, 0.6)',
    transform: 'translateY(-2px)',
  }
}));

const TransactionButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #7f5af0 30%, #2cb67d 90%)',
  border: 0,
  borderRadius: 3,
  boxShadow: '0 3px 5px 2px rgba(127, 90, 240, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  margin: theme.spacing(1),
}));

const ContractInterface = ({ onPetUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [petContract, setPetContract] = useState(null);
  const [marketContract, setMarketContract] = useState(null);

  useEffect(() => {
    const initializeContracts = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        const petNFT = new ethers.Contract(
          process.env.PET_NFT_ADDRESS,
          PetNFTContract.abi,
          signer
        );
        
        const marketplace = new ethers.Contract(
          process.env.MARKETPLACE_ADDRESS,
          MarketplaceContract.abi,
          signer
        );

        setPetContract(petNFT);
        setMarketContract(marketplace);

        // Listen for pet updates
        petNFT.on("PetStateUpdated", (tokenId, newState) => {
          onPetUpdate(tokenId, newState);
        });

      } catch (error) {
        console.error("Failed to initialize contracts:", error);
      }
    };

    initializeContracts();
  }, []);

  const mintPet = async () => {
    try {
      setLoading(true);
      const tx = await petContract.mintPet();
      await tx.wait();
      // Handle successful mint
    } catch (error) {
      console.error("Failed to mint pet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ContractCard>
        <Typography variant="h6" gutterBottom>
          Blockchain Interface
        </Typography>
        <TransactionButton
          onClick={mintPet}
          disabled={loading || !petContract}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Mint New Pet"
          )}
        </TransactionButton>
      </ContractCard>
    </motion.div>
  );
};

export default ContractInterface;
