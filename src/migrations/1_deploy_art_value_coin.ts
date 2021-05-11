require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
// @ts-ignore
import { singletons } from '@openzeppelin/test-helpers';
import { deployProxy } from '@openzeppelin/truffle-upgrades'
import { ContractClass } from '@openzeppelin/truffle-upgrades/dist/truffle'
import { ArtValueCoinInstance } from "@contract/ArtValueCoin";

const DEV_MINTER_ACC_INDEX = 6
 
module.exports = async function (deployer, network, accounts) {
  const owner = accounts[0]
  const ArtValueCoin = artifacts.require('ArtValueCoin');

  if (network === 'development') {
    await singletons.ERC1820Registry(owner);
  }

  const defaultOperators: string[] = []
  const args = ["Art_Value Coin", "AVC", defaultOperators]
  const instance = await deployProxy(
    ArtValueCoin as unknown as ContractClass,
    args,
    { deployer: deployer as any, initializer: 'initialize' }
  ) as ArtValueCoinInstance
  console.log(`ArtValueCoin deployed at ${instance.address}`);

  if (network === 'development') {
    const minter = accounts[DEV_MINTER_ACC_INDEX]
    const MINTER_ROLE = await instance.MINTER_ROLE()
    await instance.grantRole(MINTER_ROLE, minter)
    console.log(`Granted MINTER_ROLE to minter (accounts[${DEV_MINTER_ACC_INDEX}]: ${minter})`)
  }
} as Truffle.Migration
