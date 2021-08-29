require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
// @ts-ignore
import { singletons } from '@openzeppelin/test-helpers';
import { deployProxy } from '@openzeppelin/truffle-upgrades'
import { ContractClass } from '@openzeppelin/truffle-upgrades/src/utils/truffle'
import { ArtValueNumberV1Instance } from "@contract/ArtValueNumberV1";
import { wrapProvider } from '@openzeppelin/truffle-upgrades/dist/utils';

const DEV_MINTER_ACC_INDEX = 6

const NAME = 'Art Value Number'
const SYMBOL = 'AVN'
const NUMBER_BASE_URI = 'https://artvalue.org/fln/' // Fractionless number, must redirect to a nicely formatted version
const PLACEHOLDER_BASE_URI = 'https://artvalue.org/p/'
 
module.exports = async function (deployer, network, accounts) {
  const owner = accounts[0]
  const ArtValueNumber = artifacts.require('ArtValueNumberV1');

  if (network === 'development') {
    await singletons.ERC1820Registry(owner);
  }

  const args = [NAME, SYMBOL, NUMBER_BASE_URI, PLACEHOLDER_BASE_URI]
  const instance = await deployProxy(
    ArtValueNumber as unknown as ContractClass,
    args,
    { deployer: deployer as any, initializer: 'initialize' } as any
  ) as ArtValueNumberV1Instance
  console.log(`TransparentUpgradeableProxy pointing to ArtValueNumberV1 deployed at ${instance.address}`);

  if (network === 'development') {
    const minter = accounts[DEV_MINTER_ACC_INDEX]
    const MINTER_ROLE = await instance.MINTER_ROLE()
    await instance.grantRole(MINTER_ROLE, minter)
    console.log(`MINTER_ROLE granted to (accounts[${DEV_MINTER_ACC_INDEX}] == ${minter})`)
  }
} as Truffle.Migration
