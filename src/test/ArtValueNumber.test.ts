// @ts-ignore
import { expectEvent, singletons, constants } from '@openzeppelin/test-helpers';
import { deployProxy } from "@openzeppelin/truffle-upgrades";
import { ContractClass } from "@openzeppelin/truffle-upgrades/src/utils/truffle";
import { BN } from 'bn.js';
const { ZERO_ADDRESS } = constants;

import { AllEvents, ArtValueNumberInstance, Transfer } from "@contract/ArtValueNumber";
import { expectVmExceptionHasReason, expectToThrowVmExceptionWithReason } from '../util/vmException';
const ArtValueNumber = artifacts.require("ArtValueNumber")

const NAME = "Art Value Number"
const SYMBOL = "AVN"
const NUMBER_BASE_URI = "https://artvalue.org/fln/" // Fractionless number, should redirect to a nicely formatted version
const PLACEHOLDER_BASE_URI = "https://artvalue.org/p/"
const NEW_NUMBER_BASE_URI = "https://new-artvalue.org/fln/"
const NEW_PLACEHOLDER_BASE_URI = "https://new-artvalue.org/p/"

const NUMBER_ZERO = new BN(0)
const NUMBER_FOUR = new BN(400)
const NUMBER_SEVEN = new BN(700)

const NON_EXISTENT_TOKEN_ID = new BN(88) // Not guaranteed to not exist. Just don't create it

contract("ArtValueNumber", accounts => {
  const [_, registryFunder, creator, operator, roleHolder, tokenReceiver] = accounts

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.avc = await deployProxy(
      ArtValueNumber as unknown as ContractClass,
      [NAME, SYMBOL, NUMBER_BASE_URI, PLACEHOLDER_BASE_URI],
      // @ts-ignore
      { initializer: 'initialize', from: creator }
    )
  });

  const tokenIdFromMintRes = (res: Truffle.TransactionResponse<AllEvents>) => {
    const mintEvent = res.logs.find(l => l.event === 'Transfer')
    expect(mintEvent).to.not.be.undefined
    const tokenId = (mintEvent as any as Transfer).args.tokenId
    return tokenId
  }

  it('has a name', async function () {
    const avc = this.avc as ArtValueNumberInstance
    expect(await avc.name()).to.equal(NAME)
  });

  it('has a symbol', async function () {
    const avc = this.avc as ArtValueNumberInstance
    expect(await avc.symbol()).to.equal(SYMBOL)
  });

  it('allows adding minters', async function () {
    const avc = this.avc as ArtValueNumberInstance
    const MINTER_ROLE = await avc.MINTER_ROLE()
    expect(await avc.hasRole(MINTER_ROLE, roleHolder)).to.be.false
    await avc.grantRole(MINTER_ROLE, roleHolder)
    expect(await avc.hasRole(MINTER_ROLE, roleHolder)).to.be.true
  });

  it('allows minters to mint', async function () {
    const avc = this.avc as ArtValueNumberInstance
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
    const avc = this.avc as ArtValueNumberInstance
    const balanceBefore = await avc.balanceOf(tokenReceiver)
    expect(balanceBefore.toNumber()).to.equal(0)
    expectToThrowVmExceptionWithReason(
      () => avc.mintAsPlaceholder(tokenReceiver, { from: tokenReceiver }),
      'ArtValueNumber: must have minter role to mint'
    )
    const balanceAfter = await avc.balanceOf(tokenReceiver)
    expect(balanceAfter.eq(balanceBefore)).to.be.true
  });

  it('assigns a minted placeholder token no number', async function () {
    const avc = this.avc as ArtValueNumberInstance
    const tokenId = tokenIdFromMintRes(
      await avc.mintAsPlaceholder(tokenReceiver)
    )
    
    expect(await avc.isPlaceholder(tokenId)).to.be.true
    expect(await avc.hasNumberAssigned(tokenId)).to.be.false
    expectToThrowVmExceptionWithReason(
      () => avc.numberByToken(tokenId),
      'ArtValueNumber: cannot get token of unassigned number'
    )
  });

  it('assings a token minted with number a number', async function () {
    const avc = this.avc as ArtValueNumberInstance
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
      const avc = this.avc as ArtValueNumberInstance
      expect(await avc.isAssigned(NUMBER_ZERO)).to.be.false
      expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_ZERO),
        'ArtValueNumber: cannot get token of unassigned number'
      )

      expect(await avc.isAssigned(NUMBER_FOUR)).to.be.false
      expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_FOUR),
        'ArtValueNumber: cannot get token of unassigned number'
      )
    });

    it('with 0 being assigned', async function () {
      const avc = this.avc as ArtValueNumberInstance
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
      expectToThrowVmExceptionWithReason(
        () => avc.tokenByNumber(NUMBER_FOUR),
        'ArtValueNumber: cannot get token of unassigned number'
      )
    });

  })

  describe('handles URIs', () => {

    it('for tokens with a number assigned', async function () {
      const avc = this.avc as ArtValueNumberInstance
      const tokenId = tokenIdFromMintRes(
        await avc.mintWithNumber(tokenReceiver, NUMBER_FOUR)
      )

      expect(await avc.tokenURI(tokenId)).to.equal(NUMBER_BASE_URI + 400)
    });

    it('for placeholder tokens', async function () {
      const avc = this.avc as ArtValueNumberInstance
      const tokenId = tokenIdFromMintRes(
        await avc.mintAsPlaceholder(tokenReceiver)
      )
      
      expect(await avc.tokenURI(tokenId)).to.equal(PLACEHOLDER_BASE_URI + tokenId)
    });

    it('for non-existent tokens', async function () {
      const avc = this.avc as ArtValueNumberInstance
      
      expectToThrowVmExceptionWithReason(
        () => avc.tokenURI(NON_EXISTENT_TOKEN_ID),
        'ArtValueNumber: cannot get URI of nonexistent token'
      )
    });

  })

  describe('handles setting a token number', () => {

    it('for tokens with a number assigned', async function () {
      const avc = this.avc as ArtValueNumberInstance
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
      const avc = this.avc as ArtValueNumberInstance
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
      const avc = this.avc as ArtValueNumberInstance
      
      expectToThrowVmExceptionWithReason(
        () => avc.setTokenNumber(NON_EXISTENT_TOKEN_ID, NUMBER_FOUR),
        'ArtValueNumber: cannot set number of nonexistent token'
      )
    });

    it('by throwing for non-number-setters', async function () {
      const avc = this.avc as ArtValueNumberInstance
      
      expectToThrowVmExceptionWithReason(
        () => avc.setTokenNumber(
          NON_EXISTENT_TOKEN_ID, NUMBER_FOUR, { from: tokenReceiver }
        ),
        'ArtValueNumber: must have number_setter role to set token number'
      )
    });

    it('by allowing number setters to set', async function () {
      const avc = this.avc as ArtValueNumberInstance
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
      const avc = this.avc as ArtValueNumberInstance

      expect(await avc.numberBaseURI()).to.equal(NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(PLACEHOLDER_BASE_URI)

      await avc.setNumberBaseURI(NEW_NUMBER_BASE_URI)
      await avc.setPlaceholderBaseURI(NEW_PLACEHOLDER_BASE_URI)

      expect(await avc.numberBaseURI()).to.equal(NEW_NUMBER_BASE_URI)
      expect(await avc.placeholderBaseURI()).to.equal(NEW_PLACEHOLDER_BASE_URI)
    });

    it('by throwing for non-URI-setters', async function () {
      const avc = this.avc as ArtValueNumberInstance

      expect(await avc.numberBaseURI()).to.equal(NUMBER_BASE_URI)
      
      expectToThrowVmExceptionWithReason(
        () => avc.setNumberBaseURI(NEW_NUMBER_BASE_URI),
        'ArtValueNumber: must have uri_setter role to set number base uri'
      )

      expectToThrowVmExceptionWithReason(
        () => avc.setPlaceholderBaseURI(NEW_NUMBER_BASE_URI),
        'ArtValueNumber: must have uri_setter role to set placeholder base uri'
      )
    });

    it('by allowing URI-setters to set', async function () {
      const avc = this.avc as ArtValueNumberInstance
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

})
