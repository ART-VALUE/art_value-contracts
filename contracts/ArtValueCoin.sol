// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.7.4;

/// @title Art_Value Coin ERC777 Fungible Token Contract
/// @author Pieter Fiers


// import "./ERC777ERC20BaseToken.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/ERC777Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";


contract ArtValueCoin is Initializable, ERC777Upgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) public virtual initializer {
        __ERC777_init(name, symbol, defaultOperators);
    }
}
