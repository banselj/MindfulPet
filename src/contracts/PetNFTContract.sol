// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PetNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Pet attributes
    struct PetAttributes {
        string petType;
        uint256 birthTime;
        uint256 level;
        uint256 experience;
        uint256[] equippedAccessories;
        string personality;
        mapping(string => uint256) stats;
    }

    // Evolution requirements
    struct EvolutionRequirement {
        uint256 minLevel;
        uint256 minExperience;
        string[] requiredAchievements;
    }

    // Mapping from token ID to pet attributes
    mapping(uint256 => PetAttributes) private _petAttributes;
    
    // Mapping from pet type to evolution requirements
    mapping(string => EvolutionRequirement) private _evolutionRequirements;
    
    // Mapping from token ID to achievement list
    mapping(uint256 => string[]) private _achievements;

    // Events
    event PetMinted(address indexed owner, uint256 indexed tokenId, string petType);
    event PetEvolved(uint256 indexed tokenId, string fromType, string toType);
    event ExperienceGained(uint256 indexed tokenId, uint256 amount);
    event AccessoryEquipped(uint256 indexed tokenId, uint256 accessoryId);
    event AchievementUnlocked(uint256 indexed tokenId, string achievement);

    constructor() ERC721("MindfulPet", "MPET") {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mintPet(
        address to,
        string memory uri,
        string memory petType,
        string memory personality
    ) public returns (uint256) {
        require(!paused(), "Minting is paused");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        // Initialize pet attributes
        PetAttributes storage pet = _petAttributes[newTokenId];
        pet.petType = petType;
        pet.birthTime = block.timestamp;
        pet.level = 1;
        pet.experience = 0;
        pet.personality = personality;

        // Initialize base stats
        pet.stats["health"] = 100;
        pet.stats["energy"] = 100;
        pet.stats["happiness"] = 100;

        emit PetMinted(to, newTokenId, petType);
        return newTokenId;
    }

    function evolve(uint256 tokenId, string memory newType) public {
        require(_exists(tokenId), "Pet does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the pet owner");
        
        PetAttributes storage pet = _petAttributes[tokenId];
        EvolutionRequirement memory req = _evolutionRequirements[newType];

        require(pet.level >= req.minLevel, "Level too low");
        require(pet.experience >= req.minExperience, "Not enough experience");

        // Check achievements
        for (uint i = 0; i < req.requiredAchievements.length; i++) {
            require(
                hasAchievement(tokenId, req.requiredAchievements[i]),
                "Missing required achievement"
            );
        }

        string memory oldType = pet.petType;
        pet.petType = newType;
        
        // Reset experience but keep level
        pet.experience = 0;

        emit PetEvolved(tokenId, oldType, newType);
    }

    function gainExperience(uint256 tokenId, uint256 amount) public {
        require(_exists(tokenId), "Pet does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the pet owner");

        PetAttributes storage pet = _petAttributes[tokenId];
        pet.experience += amount;

        // Level up logic
        uint256 experienceThreshold = pet.level * 1000;
        while (pet.experience >= experienceThreshold) {
            pet.level += 1;
            pet.experience -= experienceThreshold;
            experienceThreshold = pet.level * 1000;
        }

        emit ExperienceGained(tokenId, amount);
    }

    function equipAccessory(uint256 tokenId, uint256 accessoryId) public {
        require(_exists(tokenId), "Pet does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the pet owner");

        PetAttributes storage pet = _petAttributes[tokenId];
        pet.equippedAccessories.push(accessoryId);

        emit AccessoryEquipped(tokenId, accessoryId);
    }

    function unlockAchievement(uint256 tokenId, string memory achievement) public {
        require(_exists(tokenId), "Pet does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the pet owner");
        require(!hasAchievement(tokenId, achievement), "Achievement already unlocked");

        _achievements[tokenId].push(achievement);
        emit AchievementUnlocked(tokenId, achievement);
    }

    function hasAchievement(uint256 tokenId, string memory achievement) public view returns (bool) {
        string[] memory achievements = _achievements[tokenId];
        for (uint i = 0; i < achievements.length; i++) {
            if (keccak256(bytes(achievements[i])) == keccak256(bytes(achievement))) {
                return true;
            }
        }
        return false;
    }

    function getPetAttributes(uint256 tokenId) public view returns (
        string memory petType,
        uint256 birthTime,
        uint256 level,
        uint256 experience,
        uint256[] memory equippedAccessories,
        string memory personality
    ) {
        require(_exists(tokenId), "Pet does not exist");
        PetAttributes storage pet = _petAttributes[tokenId];
        
        return (
            pet.petType,
            pet.birthTime,
            pet.level,
            pet.experience,
            pet.equippedAccessories,
            pet.personality
        );
    }

    function getPetStat(uint256 tokenId, string memory stat) public view returns (uint256) {
        require(_exists(tokenId), "Pet does not exist");
        return _petAttributes[tokenId].stats[stat];
    }

    function setPetStat(uint256 tokenId, string memory stat, uint256 value) public {
        require(_exists(tokenId), "Pet does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the pet owner");
        
        _petAttributes[tokenId].stats[stat] = value;
    }

    function setEvolutionRequirement(
        string memory petType,
        uint256 minLevel,
        uint256 minExperience,
        string[] memory requiredAchievements
    ) public onlyOwner {
        _evolutionRequirements[petType] = EvolutionRequirement(
            minLevel,
            minExperience,
            requiredAchievements
        );
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
