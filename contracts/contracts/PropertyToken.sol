// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title PropertyToken
 * @dev ERC721 token representing ownership shares of real estate properties
 */
contract PropertyToken is ERC721, ERC721Enumerable, Ownable {
    struct Property {
        uint256 propertyId;
        string name;
        string location;
        uint256 totalShares;
        uint256 monthlyRent; // in USDC (6 decimals)
        address propertyOwner;
        bool isActive;
    }

    mapping(uint256 => Property) public properties;
    mapping(uint256 => mapping(address => uint256)) public shares; // propertyId => user => shares
    mapping(address => uint256[]) public userProperties; // user => propertyIds

    uint256 private _nextPropertyId = 1;
    uint256 private _nextTokenId = 1;

    event PropertyCreated(
        uint256 indexed propertyId,
        string name,
        uint256 totalShares,
        uint256 monthlyRent
    );
    event SharesPurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 shares
    );
    event SharesTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 shares
    );

    constructor() ERC721("Real Estate Property Token", "REPT") Ownable(msg.sender) {}

    /**
     * @dev Create a new tokenized property
     */
    function createProperty(
        string memory name,
        string memory location,
        uint256 totalShares,
        uint256 monthlyRent
    ) external onlyOwner returns (uint256) {
        uint256 propertyId = _nextPropertyId++;
        
        properties[propertyId] = Property({
            propertyId: propertyId,
            name: name,
            location: location,
            totalShares: totalShares,
            monthlyRent: monthlyRent,
            propertyOwner: msg.sender,
            isActive: true
        });

        emit PropertyCreated(propertyId, name, totalShares, monthlyRent);
        return propertyId;
    }

    /**
     * @dev Purchase shares of a property
     */
    function purchaseShares(uint256 propertyId, uint256 amount) external {
        require(properties[propertyId].isActive, "Property not active");
        require(
            shares[propertyId][msg.sender] + amount <= properties[propertyId].totalShares,
            "Exceeds total shares"
        );

        shares[propertyId][msg.sender] += amount;
        
        // Add to user's property list if first time
        if (shares[propertyId][msg.sender] == amount) {
            userProperties[msg.sender].push(propertyId);
        }

        // Mint NFT for ownership proof
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        emit SharesPurchased(propertyId, msg.sender, amount);
    }

    /**
     * @dev Get user's share percentage of a property
     */
    function getUserSharePercentage(uint256 propertyId, address user) external view returns (uint256) {
        if (properties[propertyId].totalShares == 0) return 0;
        return (shares[propertyId][user] * 10000) / properties[propertyId].totalShares; // Basis points (10000 = 100%)
    }

    /**
     * @dev Get property details
     */
    function getProperty(uint256 propertyId) external view returns (Property memory) {
        return properties[propertyId];
    }

    /**
     * @dev Get all properties owned by a user
     */
    function getUserProperties(address user) external view returns (uint256[] memory) {
        return userProperties[user];
    }

    // Override required functions from ERC721Enumerable
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}






