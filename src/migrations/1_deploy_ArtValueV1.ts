require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
// @ts-ignore
import { singletons } from '@openzeppelin/test-helpers';
import { deployProxy } from '@openzeppelin/truffle-upgrades'
import { ContractClass } from '@openzeppelin/truffle-upgrades/src/utils/truffle'
import { ArtValueV1Instance } from "@contract/ArtValueV1";
import { wrapProvider } from '@openzeppelin/truffle-upgrades/dist/utils';
import { BN } from 'bn.js';

const DEV_MINTER_ACC_INDEX = 6

const NAME = 'Art Value'
const SYMBOL = 'AV'
const NUMBER_BASE_URI = 'https://artvalue.org/m/n/'
const PLACEHOLDER_BASE_URI = 'https://artvalue.org/m/p/'
 
module.exports = async function (deployer, network, accounts) {
  const owner = accounts[0]
  const ArtValue = artifacts.require('ArtValueV1');

  if (network === 'development') {
    await singletons.ERC1820Registry(owner);
  }

  const gasPrice = new BN(await web3.eth.getGasPrice())
  const gasPriceGWei = web3.utils.fromWei(gasPrice, 'gwei')
  const lowballGasPrice = gasPrice.div(new BN(10))
  const lowballGasPriceGWei = web3.utils.fromWei(lowballGasPrice, 'gwei')
  console.log(`Gas price estimate is: ${gasPriceGWei} (gwei), 10% of that: ${lowballGasPriceGWei}`)

  const args = [NAME, SYMBOL, NUMBER_BASE_URI, PLACEHOLDER_BASE_URI]
  const instance = await deployProxy(
    ArtValue as unknown as ContractClass,
    args,
    {deployer: deployer as any, initializer: 'initialize'} as any
  ) as ArtValueV1Instance
  console.log(`TransparentUpgradeableProxy pointing to ArtValueV1 deployed at ${instance.address}`);

  if (network === 'development') {
    const minter = accounts[DEV_MINTER_ACC_INDEX]
    const MINTER_ROLE = await instance.MINTER_ROLE()
    await instance.grantRole(MINTER_ROLE, minter)
    console.log(`MINTER_ROLE granted to (accounts[${DEV_MINTER_ACC_INDEX}] == ${minter})`)
  }
} as Truffle.Migration
