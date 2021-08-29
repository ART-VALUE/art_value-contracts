require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
// @ts-ignore
import { upgradeProxy } from '@openzeppelin/truffle-upgrades'
import { ContractClass } from '@openzeppelin/truffle-upgrades/src/utils/truffle'
import { ArtValueNumberV2Instance } from '@contract/ArtValueNumberV2';
 
module.exports = async function (deployer, network, accounts) {
  const ArtValueNumberV1 = artifacts.require('ArtValueNumber')
  const ArtValueNumberV2 = artifacts.require('ArtValueNumberV2')

  const ART_VALUE_NUMBER_ADDRESS = process.env['ART_VALUE_NUMBER_ADDRESS']
  let artValueNumberAddress
  if (ART_VALUE_NUMBER_ADDRESS == null) {
    let truffleSavedAddress = null
    try {
      truffleSavedAddress = ArtValueNumberV1.address
    } catch (error) {
      if (!error.message.includes('has no network configuration for its current network id')) {
        throw error
      }
    }
    if (truffleSavedAddress == null) {
      throw new Error('2_upgrade_to_art_calue_number_v2: neither $ART_VALUE_NUMBER_ADDRESS nor truffle saved address are set')
    } else {
      artValueNumberAddress = ArtValueNumberV1.address
      console.info(`2_upgrade_to_art_calue_number_v2: $ART_VALUE_NUMBER_ADDRESS not set, falling back to truffle saved address (${ArtValueNumberV1.address})`)
    }
  } else {
    artValueNumberAddress = ART_VALUE_NUMBER_ADDRESS
    console.info(`2_upgrade_to_art_calue_number_v2: $ART_VALUE_NUMBER_ADDRESS set, using it (${ART_VALUE_NUMBER_ADDRESS})`)
  }

  const instance = await upgradeProxy(
    artValueNumberAddress,
    ArtValueNumberV2 as unknown as ContractClass,
    { deployer: deployer as any }
  ) as ArtValueNumberV2Instance

  await instance.initializeV2Only()

  console.log(`ArtValueNumber upgraded to V2 and deployed at ${instance.address}`)
} as Truffle.Migration
