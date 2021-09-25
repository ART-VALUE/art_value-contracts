require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
// @ts-ignore
import { upgradeProxy } from '@openzeppelin/truffle-upgrades'
import { ContractClass } from '@openzeppelin/truffle-upgrades/src/utils/truffle'
import { ArtValueV2Instance } from '@contract/ArtValueV2';
 
module.exports = async function (deployer, network, accounts) {
  const ArtValueV1 = artifacts.require('ArtValueV1')
  const ArtValueV2 = artifacts.require('ArtValueV2')

  const ART_VALUE_NUMBER_ADDRESS = process.env['ART_VALUE_NUMBER_ADDRESS']
  let artValueAddress
  if (ART_VALUE_NUMBER_ADDRESS == null) {
    let truffleSavedAddress = null
    try {
      truffleSavedAddress = ArtValueV1.address
    } catch (error) {
      if (!(error as any).message.includes('has no network configuration for its current network id')) {
        throw error
      }
    }
    if (truffleSavedAddress == null) {
      throw new Error('2_upgrade_to_ArtValueV2: neither $ART_VALUE_NUMBER_ADDRESS nor truffle saved address are set')
    } else {
      artValueAddress = ArtValueV1.address
      console.info(`2_upgrade_to_ArtValueV2: $ART_VALUE_NUMBER_ADDRESS not set, falling back to truffle saved address (${ArtValueV1.address})`)
    }
  } else {
    artValueAddress = ART_VALUE_NUMBER_ADDRESS
    console.info(`2_upgrade_to_ArtValueV2: $ART_VALUE_NUMBER_ADDRESS set, using it (${ART_VALUE_NUMBER_ADDRESS})`)
  }

  const instance = await upgradeProxy(
    artValueAddress,
    ArtValueV2 as unknown as ContractClass,
    { deployer: deployer as any }
  ) as ArtValueV2Instance

  // await instance.initializeV2Only() // No initializer necessary in V2

  console.log(`ArtValue upgraded to V2. TransparentUpgradeableProxy deployed at ${instance.address}`)
} as Truffle.Migration
