// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.6.0 <0.8.0;

/// @title Art_Value Coin ERC777 Fungible Token Contract
/// @author Pieter Fiers

import "@openzeppelin/contracts-upgradeable/token/ERC777/ERC777Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract ArtValueCoin is Initializable, ERC777Upgradeable, AccessControlUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    function initialize(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) public virtual initializer {
        __AccessControl_init();
        __ERC777_init(name, symbol, defaultOperators);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, amount, userData, operatorData);
    }

    function burn(
        address from,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a burner");
        _burn(from, amount, userData, operatorData);
    }
}
