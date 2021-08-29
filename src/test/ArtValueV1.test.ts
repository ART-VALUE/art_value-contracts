// @ts-ignore
import { expectEvent, singletons, constants } from '@openzeppelin/test-helpers';
import { deployProxy, upgradeProxy } from "@openzeppelin/truffle-upgrades";
import { ContractClass } from "@openzeppelin/truffle-upgrades/src/utils/truffle";
import { BN } from 'bn.js';
const { ZERO_ADDRESS } = constants;

import { AllEvents, ArtValueV1Instance, Transfer } from "@contract/ArtValueV1";
import { expectVmExceptionHasReason, expectToThrowVmExceptionWithReason } from '../util/vmException';
const ArtValueV1 = artifacts.require("ArtValueV1")

const NAME = "Art Value"
const SYMBOL = "AV"
const NUMBER_BASE_URI = "https://artvalue.org/m/n/" // /metadata/number
const PLACEHOLDER_BASE_URI = "https://artvalue.org/m/p/" // /metadata/placeholder
const NEW_NUMBER_BASE_URI = "https://new-artvalue.org/m/n/"
const NEW_PLACEHOLDER_BASE_URI = "https://new-artvalue.org/m/p/"

const NUMBER_ZERO = new BN(0)
const NUMBER_FOUR = new BN(400)
const NUMBER_SEVEN = new BN(700)

const NON_EXISTENT_TOKEN_ID = new BN(88) // Not guaranteed to not exist. Just don't create it

/* Try it out:
 1. Go to https://eips.ethereum.org/EIPS/eip-721
 2. Copy the "ERC721 Metadata JSON Schema"
 3. Minify the JSON using any minifier (should be 509 characters long after doing so)
 4. SHA256 hash it! */
const DEFAULT_ERC721_METADATA_JSON_HASH = new BN('38001122644619d59db81455ed499ac5e95647ce920cebc2681462a75da76cfa', 'hex')

contract("ArtValueV1", accounts => {
  const [creator, registryFunder, userB, operator, roleHolder, tokenReceiver] = accounts

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    const avc = await deployProxy(
      ArtValueV1 as unknown as ContractClass,
      [NAME, SYMBOL, NUMBER_BASE_URI, PLACEHOLDER_BASE_URI],
      // @ts-ignore
      { initializer: 'initialize' }
    )
    this.avc = avc
  });

  const tokenIdFromMintRes = (res: Truffle.TransactionResponse<AllEvents>) => {
    const mintEvent = res.logs.find(l => l.event === 'Transfer')
    expect(mintEvent).to.not.be.undefined
    const tokenId = (mintEvent as any as Transfer).args.tokenId
    return tokenId
  }

  it('has a name', async function () {
    const avc = this.avc as ArtValueV1Instance

    expect(await avc.name()).to.equal(NAME)
  });

  it('has a symbol', async function () {
    const avc = this.avc as ArtValueV1Instance

    expect(await avc.symbol()).to.equal(SYMBOL)
  });

  it('has the correct owner', async function () {
    const avc = this.avc as ArtValueV1Instance

    expect(await avc.owner()).to.equal(creator)
  });

  it('allows adding minters', async function () {
    const avc = this.avc as ArtValueV1Instance
    const MINTER_ROLE = await avc.MINTER_ROLE()

    expect(await avc.hasRole(MINTER_ROLE, roleHolder)).to.be.false
    await avc.grantRole(MINTER_ROLE, roleHolder)
    expect(await avc.hasRole(MINTER_ROLE, roleHolder)).to.be.true
  });

  it('allows minters to mint', async function () {
    const avc = this.avc as ArtValueV1Instance
    const MINTER_ROLE = await avc.MINTER_ROLE()
    await avc.grantRole(MINTER_ROLE, roleHolder)

    const balanceBefore = await avc.balanceOf(tokenReceiver)
    expect(balanceBefore.toNumber()).to.equal(0)
    await avc.mintAsPlaceholder(
      tokenReceiver,
      { from: roleHolder }
    )
    const balanceAfter = await avc.balanceOf(tokenReceiver)
    expect(balanceAfter.toNumber()).to.equal(1)
  });

  it('doesn\'t allow non-minters to mint', async function () {
    const avc = this.avc as ArtValueV1Instance

    const balanceBefore = await avc.balanceOf(tokenReceiver)
    expect(balanceBefore.toNumber()).to.equal(0)
    await expectToThrowVmExceptionWithReason(
      () => avc.mintAsPlaceholder(tokenReceiver, { from: tokenReceiver }),
      'ArtValueNumber: must have minter role'
    )
    const balanceAfter = await avc.balanceOf(tokenReceiver)
    expect(balanceAfter.eq(balanceBefore)).to.be.true
  });

  it('assigns a minted placeholder token no number', async function () {
    const avc = this.avc as ArtValueV1Instance
    const tokenId = tokenIdFromMintRes(
      await avc.mintAsPlaceholder(tokenReceiver)
    )
    
    expect(await avc.isPlaceholder(tokenId)).to.be.true
    expect(await avc.hasNumberAssigned(tokenId)).to.be.false
    await expectToThrowVmExceptionWithReason(
      () => avc.numberByToken(tokenId),
      'ArtValueNumber: unassigned number'
    )
  });

  it('assings a token minted with number a number', async function () {
    const avc = this.avc as ArtValueV1Instance
    const tokenId = tokenIdFromMintRes(
      await avc.mintWithNumber(tokenReceiver, NUMBER_FOUR)
    )
    
    expect(await avc.isPlaceholder(tokenId)).to.be.false
    expect(await avc.hasNumberAssigned(tokenId)).to.be.true
    expect(await avc.isAssigned(NUMBER_FOUR)).to.be.true
    expect(
      (await avc.numberByToken(tokenId)).eq(NUMBER_FOUR),
      `Expect \`numberByToken()\` to be \`NUMBER_FOUR\``
    ).to.be.true
    expect(
      (await avc.tokenByNumber(NUMBER_FOUR)).eq(tokenId),
      `Expect \`tokenByNumber()\` to be \`tokenId\``
    ).to.be.true
  });

  describe('handles the number 0', () => {

    it('with 0 not being assigned', async function () {
      const avc = this.avc as ArtValueV1Instance
      expect(await avc.isAssigned(NUMBER_ZERO)).to.be.false
      await expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_ZERO),
        'ArtValueNumber: unassigned number'
      )

      expect(await avc.isAssigned(NUMBER_FOUR)).to.be.false
      await expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_FOUR),
        'ArtValueNumber: unassigned number'
      )
    });

    it('with 0 being assigned', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintWithNumber(tokenReceiver, NUMBER_ZERO)
      )
      
      expect(await avc.isPlaceholder(tokenId)).to.be.false
      expect(await avc.hasNumberAssigned(tokenId)).to.be.true
      expect(await avc.isAssigned(NUMBER_ZERO)).to.be.true
      expect(
        (await avc.tokenByNumber(NUMBER_ZERO)).eq(tokenId),
        `Expect \`tokenByNumber()\` to be \`tokenId\``
      ).to.be.true

      expect(await avc.isAssigned(NUMBER_FOUR)).to.be.false
      await expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_FOUR),
        'ArtValueNumber: unassigned number'
      )
    });

  })

  describe('handles URIs', () => {

    it('for tokens with a number assigned', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintWithNumber(tokenReceiver, NUMBER_FOUR)
      )

      expect(await avc.tokenURI(tokenId)).to.equal(NUMBER_BASE_URI + 400)
    });

    it('for placeholder tokens', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )
      
      expect(await avc.tokenURI(tokenId)).to.equal(PLACEHOLDER_BASE_URI + tokenId)
    });

    it('for non-existent tokens', async function () {
      const avc = this.avc as ArtValueV1Instance
      
      await expectToThrowVmExceptionWithReason(
        () => avc.tokenURI(NON_EXISTENT_TOKEN_ID),
        'ArtValueNumber: nonexistent token'
      )
    });

  })

  describe('handles setting a token number', () => {

    it('for tokens with a number assigned', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintWithNumber(tokenReceiver, NUMBER_FOUR)
      )

      expect(
        (await avc.numberByToken(tokenId)).eq(NUMBER_FOUR),
        `Expect \`numberByToken()\` to be \`NUMBER_FOUR\` before setting`
      ).to.be.true

      await avc.setTokenNumber(tokenId, NUMBER_SEVEN)

      expect(
        (await avc.numberByToken(tokenId)).eq(NUMBER_SEVEN),
        `Expect \`numberByToken()\` to be \`NUMBER_SEVEN\` after setting`
      ).to.be.true
    });

    it('for placeholder tokens', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      expect(await avc.isPlaceholder(tokenId)).to.be.true

      await avc.setTokenNumber(tokenId, NUMBER_SEVEN)

      expect(
        (await avc.numberByToken(tokenId)).eq(NUMBER_SEVEN),
        `Expect \`numberByToken()\` to be \`NUMBER_SEVEN\` after setting`
      ).to.be.true
    });

    it('for non-existent tokens', async function () {
      const avc = this.avc as ArtValueV1Instance
      
      await expectToThrowVmExceptionWithReason(
        () => avc.setTokenNumber(NON_EXISTENT_TOKEN_ID, NUMBER_FOUR),
        'ArtValueNumber: nonexistent token'
      )
    });

    it('by throwing for non-number-setters', async function () {
      const avc = this.avc as ArtValueV1Instance
      
      await expectToThrowVmExceptionWithReason(
        () => avc.setTokenNumber(
          NON_EXISTENT_TOKEN_ID, NUMBER_FOUR, { from: tokenReceiver }
        ),
        'ArtValueNumber: must have number_setter role'
      )
    });

    it('by allowing number setters to set', async function () {
      const avc = this.avc as ArtValueV1Instance
      const NUMBER_SETTER_ROLE = await avc.NUMBER_SETTER_ROLE()
      await avc.grantRole(NUMBER_SETTER_ROLE, roleHolder)
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      expect(await avc.isPlaceholder(tokenId)).to.be.true

      await avc.setTokenNumber(tokenId, NUMBER_SEVEN, { from: roleHolder })

      expect(
        (await avc.numberByToken(tokenId)).eq(NUMBER_SEVEN),
        `Expect \`numberByToken()\` to be \`NUMBER_SEVEN\` after setting`
      ).to.be.true
    });

  })

  describe('handles setting base URIs', () => {

    it('by setting the base URI', async function () {
      const avc = this.avc as ArtValueV1Instance

      expect(await avc.numberBaseURI()).to.equal(NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(PLACEHOLDER_BASE_URI)

      await avc.setNumberBaseURI(NEW_NUMBER_BASE_URI)
      await avc.setPlaceholderBaseURI(NEW_PLACEHOLDER_BASE_URI)

      expect(await avc.numberBaseURI()).to.equal(NEW_NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(NEW_PLACEHOLDER_BASE_URI)
    });

    it('by throwing for non-URI-setters', async function () {
      const avc = this.avc as ArtValueV1Instance

      expect(await avc.numberBaseURI()).to.equal(NUMBER_BASE_URI)
      
      await expectToThrowVmExceptionWithReason(
        () => avc.setNumberBaseURI(NEW_NUMBER_BASE_URI),
        'ArtValueNumber: must have uri_setter role'
      )

      await expectToThrowVmExceptionWithReason(
        () => avc.setPlaceholderBaseURI(NEW_NUMBER_BASE_URI),
        'ArtValueNumber: must have uri_setter role'
      )
    });

    it('by allowing URI-setters to set', async function () {
      const avc = this.avc as ArtValueV1Instance
      const URI_SETTER_ROLE = await avc.URI_SETTER_ROLE()
      await avc.grantRole(URI_SETTER_ROLE, roleHolder)

      expect(await avc.numberBaseURI()).to.equal(NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(PLACEHOLDER_BASE_URI)

      await avc.setNumberBaseURI(NEW_NUMBER_BASE_URI, { from: roleHolder })
      await avc.setPlaceholderBaseURI(NEW_PLACEHOLDER_BASE_URI, { from: roleHolder })

      expect(await avc.numberBaseURI()).to.equal(NEW_NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(NEW_PLACEHOLDER_BASE_URI)
    });

  })

  describe('handles metadata hashes', () => {

    it('allows setting and getting', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await avc.setMetadataHash(tokenId, DEFAULT_ERC721_METADATA_JSON_HASH, { from: tokenReceiver })

      expect(
        (await avc.metadataHash(tokenId)).eq(DEFAULT_ERC721_METADATA_JSON_HASH),
        `Expect \`metadataHash()\` to be \`DEFAULT_ERC721_METADATA_JSON_HASH\` after setting`
      ).to.be.true
    });

    it('throws for non-number-setters', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await expectToThrowVmExceptionWithReason(
        () => avc.setMetadataHash(tokenId, DEFAULT_ERC721_METADATA_JSON_HASH, { from: roleHolder }),
        'ArtValueNumber: must have metadata_hash_setter role or be approved or owner'
      )
    });

    it('allows setting by metadata_hash_setter', async function () {
      const avc = this.avc as ArtValueV1Instance
      const METADATA_HASH_SETTER_ROLE = await avc.METADATA_HASH_SETTER_ROLE()
      await avc.grantRole(METADATA_HASH_SETTER_ROLE, roleHolder)
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await avc.setMetadataHash(tokenId, DEFAULT_ERC721_METADATA_JSON_HASH, { from: roleHolder })

      expect(
        (await avc.metadataHash(tokenId)).eq(DEFAULT_ERC721_METADATA_JSON_HASH),
        `Expect \`metadataHash()\` to be \`DEFAULT_ERC721_METADATA_JSON_HASH\` after setting`
      ).to.be.true
    });

  });

  describe('handles pausing/unpausing of tokens', () => {

    it('allows pausing', async function () {
      const avc = this.avc as ArtValueV1Instance
      const PAUSER_ROLE = await avc.PAUSER_ROLE()
      await avc.grantRole(PAUSER_ROLE, roleHolder)
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      expect(
        await avc.isPaused(tokenId),
        `Expect \`isPaused()\` to be \`false\` after creation`
      ).to.be.false

      await avc.pauseToken(tokenId, { from: roleHolder })

      expect(
        await avc.isPaused(tokenId),
        `Expect \`isPaused()\` to be \`true\` after pausing`
      ).to.be.true
    });

    it('allows unpausing', async function () {
      const avc = this.avc as ArtValueV1Instance
      const PAUSER_ROLE = await avc.PAUSER_ROLE()
      await avc.grantRole(PAUSER_ROLE, roleHolder)
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await avc.pauseToken(tokenId, { from: roleHolder })

      expect(
        await avc.isPaused(tokenId),
        `Expect \`isPaused()\` to be \`true\` after pausing`
      ).to.be.true

      await avc.unpauseToken(tokenId, { from: roleHolder })

      expect(
        await avc.isPaused(tokenId),
        `Expect \`isPaused()\` to be \`false\` after unpausing`
      ).to.be.false
    });

    it('throws for non-pausers', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await expectToThrowVmExceptionWithReason(
        () => avc.pauseToken(tokenId, { from: roleHolder }),
        'ArtValueNumber: must have pauser role'
      )

      await expectToThrowVmExceptionWithReason(
        () => avc.unpauseToken(tokenId, { from: roleHolder }),
        'ArtValueNumber: must have pauser role'
      )
    });

    it('allows transfer when not paused', async function () {
      const avc = this.avc as ArtValueV1Instance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await avc.transferFrom(tokenReceiver, userB, tokenId, { from: tokenReceiver })

      expect(
        await avc.ownerOf(tokenId),
        `Expect \`ownerOf()\` to be \`userB\` after transfer`
      ).to.be.eq(userB)
    });

    it('disallows transfer when paused', async function () {
      const avc = this.avc as ArtValueV1Instance
      const PAUSER_ROLE = await avc.PAUSER_ROLE()
      await avc.grantRole(PAUSER_ROLE, roleHolder)
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )

      await avc.pauseToken(tokenId, { from: roleHolder })

      await expectToThrowVmExceptionWithReason(
        () => avc.transferFrom(tokenReceiver, userB, tokenId, { from: tokenReceiver }),
        'ArtValueNumber: token transfer while paused'
      )

      expect(
        await avc.ownerOf(tokenId),
        `Expect \`ownerOf()\` to still be \`tokenReceiver\` after failed transfer`
      ).to.be.eq(tokenReceiver)
    });

  });

});
