// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

// Import ERC20 implementation from OpenZeppelin
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Import Ownable contract from OpenZeppelin for ownership management
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenA
 * @dev Implementation of a custom ERC20 token with minting functionality
 * The contract is Ownable, meaning only the owner can mint new tokens.
 */
contract TokenA is ERC20, Ownable {
    
    /**
     * @dev Constructor that sets the initial token distribution and ownership
     * @param recipient Address to receive the initial minted tokens
     * @param initialOwner Address that will own the contract
     */
    constructor(address recipient, address initialOwner)
        ERC20("tokenA", "TOKA") // Set the name and symbol of the token
        Ownable(initialOwner)   // Set the initial owner of the contract
    {
        // Mint 1,000,000,000,000,000,000 tokens (1 token with 18 decimals) to the recipient
        _mint(recipient, 1000000000000000000 * 10 ** decimals());
    }

    /**
     * @dev Mint new tokens to a specified address. Only callable by the contract owner.
     * @param to Address that will receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        // Mint the specified amount of tokens to the provided address
        _mint(to, amount);
    }
}