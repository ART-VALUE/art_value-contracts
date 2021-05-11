// @ts-ignore
import { expectEvent, singletons, constants } from '@openzeppelin/test-helpers';
import { deployProxy } from "@openzeppelin/truffle-upgrades";
import { ContractClass } from "@openzeppelin/truffle-upgrades/dist/truffle";
import { BN } from 'bn.js';
const { ZERO_ADDRESS } = constants;

import { ArtValueCoinInstance } from "@contract/ArtValueCoin";
const ArtValueCoin = artifacts.require("ArtValueCoin")

contract("ArtValueCoin", accounts => {
  const [_, registryFunder, creator, operator, minter, coinReceiver] = accounts

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.avc = await deployProxy(
      ArtValueCoin as unknown as ContractClass,
      ["Art_Value Coin", "AVC", []],
      // @ts-ignore
      { initializer: 'initialize', from: creator }
    )
  });

  it('has a name', async function () {
    const avc = this.avc as ArtValueCoinInstance
    expect(await avc.name()).to.equal("Art_Value Coin")
  });

  it('has a symbol', async function () {
    const avc = this.avc as ArtValueCoinInstance
    expect(await avc.symbol()).to.equal("AVC")
  });

  it('allows adding minters', async function () {
    const avc = this.avc as ArtValueCoinInstance
    const MINTER_ROLE = await avc.MINTER_ROLE()
    expect(await avc.hasRole(MINTER_ROLE, minter)).to.be.false
    await avc.grantRole(MINTER_ROLE, minter)
    expect(await avc.hasRole(MINTER_ROLE, minter)).to.be.true
  });

  it('allows minters to mint', async function () {
    const avc = this.avc as ArtValueCoinInstance
    const MINTER_ROLE = await avc.MINTER_ROLE()
    await avc.grantRole(MINTER_ROLE, minter)
    const balanceBefore = await avc.balanceOf(coinReceiver)
    expect(balanceBefore.toNumber()).to.equal(0)
    const amount = new BN(1)
    await avc.mint(
      coinReceiver,
      amount,
      web3.utils.toHex(""),
      web3.utils.toHex(""),
      { from: minter }
    )
    const balanceAfter = await avc.balanceOf(coinReceiver)
    expect(balanceAfter.toNumber()).to.equal(1)
  });
})
