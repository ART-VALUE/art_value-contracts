// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/// @title Art Value Number ERC721 Non-Fungible Token Contract
/// @author Pieter Fiers

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @dev Contract to manage Art Value Numbers.
 *
 * Numbers are represented as uint256s with two decimal digits of floating
 * point precision (1234 represents 12.34).
 *
 * TokenId for an unassigned number will be 0. 
 */
contract ArtValueNumber is 
    Initializable, 
    ContextUpgradeable, 
    AccessControlEnumerableUpgradeable, 
    ERC721EnumerableUpgradeable, 
    ERC721BurnableUpgradeable, 
    ERC721PausableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant NUMBER_SETTER_ROLE = keccak256("NUMBER_SETTER_ROLE");
    CountersUpgradeable.Counter private _tokenIdCounter;

    string private _numberBaseURI;
    string private _placeholderBaseURI;

    /* Mapping of tokens to numbers (and reverse). Guaranteed to be consistent.
    If a token is present in this map, its URI is `{_numberBaseURI}{number}`.
    Else its URI is `{_placeholderBaseURI}{tokenId}`.

    See also tokenURI(uint256 tokenId).

    The number 0 means unassigned.
    The literal number 0 is represented by 2**256 - 1. */
    mapping (uint256 => uint256) private _tokenNumberMap;
    mapping (uint256 => uint256) private _numberTokenMap;

    function initialize(string memory name, string memory symbol, string memory __numberBaseURI, string memory __placeholderBaseURI) public virtual initializer {
        __ArtValueNumber_init(name, symbol, __numberBaseURI, __placeholderBaseURI);
    }

    function __ArtValueNumber_init(string memory name, string memory symbol, string memory __numberBaseURI, string memory __placeholderBaseURI) internal initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __AccessControl_init_unchained();
        __AccessControlEnumerable_init_unchained();
        __ERC721_init_unchained(name, symbol);
        __ERC721Enumerable_init_unchained();
        __ERC721Burnable_init_unchained();
        __Pausable_init_unchained();
        __ERC721Pausable_init_unchained();
        __ArtValueNumber_init_unchained(__numberBaseURI, __placeholderBaseURI);
    }

    function __ArtValueNumber_init_unchained(string memory __numberBaseURI, string memory __placeholderBaseURI) internal initializer {
        _numberBaseURI = __numberBaseURI;
        _placeholderBaseURI = __placeholderBaseURI;

        _tokenIdCounter.increment(); // Set to at least 1

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        _setupRole(URI_SETTER_ROLE, _msgSender());
        _setupRole(NUMBER_SETTER_ROLE, _msgSender());
    }

    /*********
    * Number *
    **********/

    function setTokenNumber(uint256 tokenId, uint256 newTokenNumber) public {
        require(hasRole(NUMBER_SETTER_ROLE, _msgSender()), "ArtValueNumber: must have number_setter role to set token number");
        require(_exists(tokenId), "ArtValueNumber: cannot set number of nonexistent token");
        
        _setTokenNumber(tokenId, newTokenNumber);
    }

    function unsetTokenNumber(uint256 tokenId) public {
        require(hasRole(NUMBER_SETTER_ROLE, _msgSender()), "ArtValueNumber: must have number_setter role to set token number");
        require(_exists(tokenId), "ArtValueNumber: cannot unset number of nonexistent token");
        
        _unsetTokenNumber(tokenId);
    }

    /**
    * Do not use this method to check wether a token has a number
    * assigned or not by comparing to 0. Use 
    * `hasNumberAssigned()` or `isPlaceholder()` for that 
    * instead. (0 might be the actual assigned number)
    */
    function numberByToken(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "ArtValueNumber: cannot get number of nonexistent token");

        return _tokenNumberMap[tokenId];
    }

    function tokenByNumber(uint256 number) public view returns (uint256) {
        require(isAssigned(number), "ArtValueNumber: cannot get token of unassigned number");

        return _numberTokenMap[number];
    }

    function isPlaceholder(uint256 tokenId) public view returns (bool) {
        return !hasNumberAssigned(tokenId);
    }

    function hasNumberAssigned(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "ArtValueNumber: cannot check if token has number assigned for nonexistent token");

        /* We cannot check `_tokenNumberMap[tokenId]` != 0 directly. Because
        it might have the actual number 0 assigned. In the case where the number
        0 is assigned to another token: storedTokenId != tokenId. */
        return _numberTokenMap[_tokenNumberMap[tokenId]] == tokenId;
    }

    function isAssigned(uint256 number) public view returns (bool) {
        /* If 0 is assigned, the tokenId (`_numberTokenMap[0]`)
        will be greater than 0 (_tokenIdCounter is initialized
        to at least 1). */
        return _numberTokenMap[number] != 0;
    }

    /******
    * URI *
    *******/

    function numberBaseURI() public view returns(string memory) {
        return _numberBaseURI;
    }

    function placeholderBaseURI() public view returns(string memory) {
        return _placeholderBaseURI;
    }

    function setNumberBaseURI(string memory __numberBaseURI) public {
        require(hasRole(URI_SETTER_ROLE, _msgSender()), "ArtValueNumber: must have uri_setter role to set number base uri");
        
        _numberBaseURI = __numberBaseURI;
    }

    function setPlaceholderBaseURI(string memory __placeholderBaseURI) public {
        require(hasRole(URI_SETTER_ROLE, _msgSender()), "ArtValueNumber: must have uri_setter role to set placeholder base uri");
        
        _placeholderBaseURI = __placeholderBaseURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ArtValueNumber: cannot get URI of nonexistent token");

        uint256 number = _tokenNumberMap[tokenId];

        // If the number is assigned (necessarily to tokenId), return the number URI
        if (isAssigned(number)) {
            return string(abi.encodePacked(
                _numberBaseURI,
                StringsUpgradeable.toString(number)
            ));
        }

        // ...else, return the placeholder URI
        return string(abi.encodePacked(
            _placeholderBaseURI,
            StringsUpgradeable.toString(tokenId)
        ));
    }

    /**********
    * Minting *
    ***********/

    function mintWithNumber(address to, uint256 number) public returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()), "ArtValueNumber: must have minter role to mint");
        require(!isAssigned(number), "ArtValueNumber: cannot mint token with already assigned number");
        
        uint256 tokenId = _mintWithAutoId(to);
        _setTokenNumberUnchecked(tokenId, number);
        return tokenId;
    }

    function mintAsPlaceholder(address to) public returns (uint256) {
        require(hasRole(MINTER_ROLE, _msgSender()), "ArtValueNumber: must have minter role to mint");

        return _mintWithAutoId(to);
    }

    /**********
    * Bruning *
    ***********/

    function burnAsBurner(uint256 tokenId) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "ArtValueNumber: must have burner role to burn as burner");
        require(_exists(tokenId), "ArtValueNumber: cannot burn nonexistent token");

        _burn(tokenId);
    }

    /**********
    * Pausing *
    ***********/

    function pause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ArtValueNumber: must have pauser role to pause");

        _pause();
    }

    function unpause() public {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ArtValueNumber: must have pauser role to unpause");

        _unpause();
    }

    /************
    * Internals *
    *************/

    function _mintWithAutoId(address to) internal returns (uint256) {
        uint256 newItemId = _tokenIdCounter.current();
        _safeMint(to, newItemId);
        _tokenIdCounter.increment();
        return newItemId;
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        super._burn(tokenId);

        _unsetTokenNumber(tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Sets `_number` as the number of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenNumber(uint256 tokenId, uint256 _number) internal {
        require(_exists(tokenId), "ArtValueNumber: cannot set number of nonexistent token");
        require(!isAssigned(_number), "ArtValueNumber: cannot set token number to already assigned number");

        _setTokenNumberUnchecked(tokenId, _number);
    }

    function _setTokenNumberUnchecked(uint256 tokenId, uint256 _number) internal {
        _tokenNumberMap[tokenId] = _number;
        _numberTokenMap[_number] = tokenId;
    }

    /**
     * @dev Unsets the number of `tokenId` if it was set.
     *
     */
    function _unsetTokenNumber(uint256 tokenId) internal {
        if (hasNumberAssigned(tokenId)) {
            delete _tokenNumberMap[tokenId];
            delete _numberTokenMap[_tokenNumberMap[tokenId]];
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControlEnumerableUpgradeable, ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
