// @ts-ignore
import { expectEvent, singletons, constants } from '@openzeppelin/test-helpers';
import { deployProxy } from "@openzeppelin/truffle-upgrades";
import { ContractClass } from "@openzeppelin/truffle-upgrades/src/utils/truffle";
import { BN } from 'bn.js';
const { ZERO_ADDRESS } = constants;

import { ArtsInstance } from "@contract/Arts";
const Arts = artifacts.require("Arts")

const NAME = "Art Value ARTS"
const SYMBOL = "ARTS"

contract("Arts", accounts => {
  const [_, registryFunder, creator, operator, minter, coinReceiver] = accounts

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.avc = await deployProxy(
      Arts as unknown as ContractClass,
      [NAME, SYMBOL, []],
      // @ts-ignore
      { initializer: 'initialize', from: creator }
    )
  });

  /*

  it('has a name', async function () {
    const avc = this.avc as ArtsInstance
    expect(await avc.name()).to.equal(NAME)
  });

  it('has a symbol', async function () {
    const avc = this.avc as ArtsInstance
    expect(await avc.symbol()).to.equal(SYMBOL)
  });

  it('allows adding minters', async function () {
    const avc = this.avc as ArtsInstance
    const MINTER_ROLE = await avc.MINTER_ROLE()
    expect(await avc.hasRole(MINTER_ROLE, minter)).to.be.false
    await avc.grantRole(MINTER_ROLE, minter)
    expect(await avc.hasRole(MINTER_ROLE, minter)).to.be.true
  });

  it('allows minters to mint', async function () {
    const avc = this.avc as ArtsInstance
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

  */
})
