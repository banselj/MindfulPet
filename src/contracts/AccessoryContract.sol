// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PetAccessory is ERC721, ERC721URIStorage, ERC721Enumerable, Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Accessory attributes
    struct AccessoryAttributes {
        string accessoryType;
        string rarity;
        uint256 mintTime;
        bool tradeable;
        mapping(string => int256) statModifiers;
        string[] effects;
    }

    // Rarity levels and their weights
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }
    
    // Mapping from token ID to accessory attributes
    mapping(uint256 => AccessoryAttributes) private _accessoryAttributes;
    
    // Mapping from accessory type to base stat modifiers
    mapping(string => mapping(string => int256)) private _baseStatModifiers;
    
    // Mapping from rarity to stat multiplier (in basis points, e.g., 1000 = 1x)
    mapping(Rarity => uint256) private _rarityMultipliers;

    // Events
    event AccessoryMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string accessoryType,
        string rarity
    );
    
    event AccessoryEquipped(
        uint256 indexed accessoryId,
        uint256 indexed petId
    );
    
    event AccessoryUnequipped(
        uint256 indexed accessoryId,
        uint256 indexed petId
    );
    
    event AccessoryEffectTriggered(
        uint256 indexed accessoryId,
        string effect,
        uint256 timestamp
    );

    constructor() ERC721("PetAccessory", "PACC") {
        // Initialize rarity multipliers
        _rarityMultipliers[Rarity.COMMON] = 1000;    // 1x
        _rarityMultipliers[Rarity.UNCOMMON] = 1250;  // 1.25x
        _rarityMultipliers[Rarity.RARE] = 1500;      // 1.5x
        _rarityMultipliers[Rarity.EPIC] = 2000;      // 2x
        _rarityMultipliers[Rarity.LEGENDARY] = 3000; // 3x
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mintAccessory(
        address to,
        string memory uri,
        string memory accessoryType,
        string memory rarity,
        bool tradeable
    ) public returns (uint256) {
        require(!paused(), "Minting is paused");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);

        // Initialize accessory attributes
        AccessoryAttributes storage accessory = _accessoryAttributes[newTokenId];
        accessory.accessoryType = accessoryType;
        accessory.rarity = rarity;
        accessory.mintTime = block.timestamp;
        accessory.tradeable = tradeable;

        // Apply base stat modifiers with rarity multiplier
        Rarity rarityEnum = parseRarity(rarity);
        uint256 multiplier = _rarityMultipliers[rarityEnum];
        
        mapping(string => int256) storage baseModifiers = _baseStatModifiers[accessoryType];
        string[3] memory stats = ["health", "energy", "happiness"];
        
        for (uint i = 0; i < stats.length; i++) {
            int256 baseModifier = baseModifiers[stats[i]];
            accessory.statModifiers[stats[i]] = (baseModifier * int256(multiplier)) / 1000;
        }

        emit AccessoryMinted(to, newTokenId, accessoryType, rarity);
        return newTokenId;
    }

    function setBaseStatModifiers(
        string memory accessoryType,
        string[] memory stats,
        int256[] memory modifiers
    ) public onlyOwner {
        require(stats.length == modifiers.length, "Arrays length mismatch");
        
        for (uint i = 0; i < stats.length; i++) {
            _baseStatModifiers[accessoryType][stats[i]] = modifiers[i];
        }
    }

    function addEffect(uint256 tokenId, string memory effect) public {
        require(_exists(tokenId), "Accessory does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the accessory owner");

        _accessoryAttributes[tokenId].effects.push(effect);
    }

    function triggerEffect(uint256 tokenId, string memory effect) public {
        require(_exists(tokenId), "Accessory does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the accessory owner");

        bool hasEffect = false;
        string[] storage effects = _accessoryAttributes[tokenId].effects;
        
        for (uint i = 0; i < effects.length; i++) {
            if (keccak256(bytes(effects[i])) == keccak256(bytes(effect))) {
                hasEffect = true;
                break;
            }
        }

        require(hasEffect, "Effect not available for this accessory");

        emit AccessoryEffectTriggered(tokenId, effect, block.timestamp);
    }

    function getAccessoryAttributes(uint256 tokenId) public view returns (
        string memory accessoryType,
        string memory rarity,
        uint256 mintTime,
        bool tradeable,
        string[] memory effects
    ) {
        require(_exists(tokenId), "Accessory does not exist");
        AccessoryAttributes storage accessory = _accessoryAttributes[tokenId];
        
        return (
            accessory.accessoryType,
            accessory.rarity,
            accessory.mintTime,
            accessory.tradeable,
            accessory.effects
        );
    }

    function getStatModifier(uint256 tokenId, string memory stat) public view returns (int256) {
        require(_exists(tokenId), "Accessory does not exist");
        return _accessoryAttributes[tokenId].statModifiers[stat];
    }

    function setTradeable(uint256 tokenId, bool tradeable) public {
        require(_exists(tokenId), "Accessory does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not the accessory owner");
        
        _accessoryAttributes[tokenId].tradeable = tradeable;
    }

    function parseRarity(string memory rarity) internal pure returns (Rarity) {
        bytes32 rarityHash = keccak256(bytes(rarity));
        
        if (rarityHash == keccak256(bytes("COMMON"))) return Rarity.COMMON;
        if (rarityHash == keccak256(bytes("UNCOMMON"))) return Rarity.UNCOMMON;
        if (rarityHash == keccak256(bytes("RARE"))) return Rarity.RARE;
        if (rarityHash == keccak256(bytes("EPIC"))) return Rarity.EPIC;
        if (rarityHash == keccak256(bytes("LEGENDARY"))) return Rarity.LEGENDARY;
        
        revert("Invalid rarity");
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        require(
            _accessoryAttributes[tokenId].tradeable || from == address(0) || to == address(0),
            "Accessory is not tradeable"
        );
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
