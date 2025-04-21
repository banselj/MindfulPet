// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PetMarketplace is ReentrancyGuard, Pausable, Ownable {
    // Marketplace item struct
    struct MarketItem {
        uint256 tokenId;
        address seller;
        address nftContract;
        uint256 price;
        bool isAuction;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        bool sold;
    }

    // Mapping from Market item ID to MarketItem
    mapping(uint256 => MarketItem) private idToMarketItem;
    
    // Counter for market items
    uint256 private _itemIds;
    
    // Counter for items sold
    uint256 private _itemsSold;
    
    // Platform fee percentage (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeePercent;
    
    // Minimum auction duration (in seconds)
    uint256 public constant MIN_AUCTION_DURATION = 1 days;
    
    // Minimum bid increase percentage (in basis points)
    uint256 public constant MIN_BID_INCREMENT = 500; // 5%

    // Events
    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        bool isAuction,
        uint256 auctionEndTime
    );
    
    event MarketItemSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    event AuctionBid(
        uint256 indexed itemId,
        address indexed bidder,
        uint256 bid
    );
    
    event AuctionEnded(
        uint256 indexed itemId,
        address winner,
        uint256 amount
    );

    constructor(uint256 _platformFeePercent) {
        platformFeePercent = _platformFeePercent;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        bool isAuction,
        uint256 auctionDuration
    ) public nonReentrant whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "NFT not approved for marketplace"
        );

        _itemIds++;
        uint256 itemId = _itemIds;

        uint256 auctionEndTime = 0;
        if (isAuction) {
            require(
                auctionDuration >= MIN_AUCTION_DURATION,
                "Auction duration too short"
            );
            auctionEndTime = block.timestamp + auctionDuration;
        }

        idToMarketItem[itemId] = MarketItem(
            tokenId,
            msg.sender,
            nftContract,
            price,
            isAuction,
            auctionEndTime,
            address(0),
            0,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            price,
            isAuction,
            auctionEndTime
        );
    }

    function createMarketSale(uint256 itemId) public payable nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        require(!item.isAuction, "Item is up for auction");
        require(!item.sold, "Item already sold");
        require(msg.value == item.price, "Please submit the asking price");

        item.sold = true;
        _itemsSold++;

        IERC721(item.nftContract).transferFrom(address(this), msg.sender, item.tokenId);
        
        uint256 platformFee = (msg.value * platformFeePercent) / 10000;
        payable(owner()).transfer(platformFee);
        payable(item.seller).transfer(msg.value - platformFee);

        emit MarketItemSold(
            itemId,
            item.nftContract,
            item.tokenId,
            item.seller,
            msg.sender,
            msg.value
        );
    }

    function placeBid(uint256 itemId) public payable nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        require(item.isAuction, "Item is not up for auction");
        require(!item.sold, "Auction has ended");
        require(block.timestamp < item.auctionEndTime, "Auction has ended");
        
        uint256 minBid = item.highestBid > 0 
            ? item.highestBid + ((item.highestBid * MIN_BID_INCREMENT) / 10000)
            : item.price;
            
        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (item.highestBidder != address(0)) {
            payable(item.highestBidder).transfer(item.highestBid);
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;

        emit AuctionBid(itemId, msg.sender, msg.value);
    }

    function endAuction(uint256 itemId) public nonReentrant whenNotPaused {
        MarketItem storage item = idToMarketItem[itemId];
        require(item.isAuction, "Item is not up for auction");
        require(!item.sold, "Auction has already ended");
        require(
            block.timestamp >= item.auctionEndTime,
            "Auction has not ended yet"
        );

        item.sold = true;
        _itemsSold++;

        if (item.highestBidder != address(0)) {
            IERC721(item.nftContract).transferFrom(
                address(this),
                item.highestBidder,
                item.tokenId
            );

            uint256 platformFee = (item.highestBid * platformFeePercent) / 10000;
            payable(owner()).transfer(platformFee);
            payable(item.seller).transfer(item.highestBid - platformFee);

            emit AuctionEnded(itemId, item.highestBidder, item.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(item.nftContract).transferFrom(
                address(this),
                item.seller,
                item.tokenId
            );
        }
    }

    function cancelListing(uint256 itemId) public nonReentrant {
        MarketItem storage item = idToMarketItem[itemId];
        require(msg.sender == item.seller, "Only seller can cancel");
        require(!item.sold, "Item already sold");
        
        if (item.isAuction && item.highestBidder != address(0)) {
            // Refund highest bidder
            payable(item.highestBidder).transfer(item.highestBid);
        }

        IERC721(item.nftContract).transferFrom(
            address(this),
            item.seller,
            item.tokenId
        );

        delete idToMarketItem[itemId];
    }

    // View functions
    function getMarketItem(uint256 itemId) public view returns (MarketItem memory) {
        return idToMarketItem[itemId];
    }

    function getLatestItems(uint256 limit) public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds;
        uint currentIndex = 0;
        
        MarketItem[] memory items = new MarketItem[](
            limit < totalItemCount ? limit : totalItemCount
        );

        for (uint i = totalItemCount; i > 0 && currentIndex < limit; i--) {
            if (!idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }

        return items;
    }

    function getUserListings(address user) public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds;
        uint itemCount = 0;
        
        // Count user's items
        for (uint i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == user && !idToMarketItem[i].sold) {
                itemCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        uint currentIndex = 0;

        for (uint i = 1; i <= totalItemCount; i++) {
            if (idToMarketItem[i].seller == user && !idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }

        return items;
    }

    // Admin functions
    function updatePlatformFee(uint256 _platformFeePercent) public onlyOwner {
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _platformFeePercent;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw(address payable recipient) public onlyOwner {
        recipient.transfer(address(this).balance);
    }

    function emergencyWithdrawToken(
        address tokenContract,
        address recipient,
        uint256 amount
    ) public onlyOwner {
        IERC20(tokenContract).transfer(recipient, amount);
    }

    function emergencyWithdrawNFT(
        address nftContract,
        address recipient,
        uint256 tokenId
    ) public onlyOwner {
        IERC721(nftContract).transferFrom(address(this), recipient, tokenId);
    }
}
