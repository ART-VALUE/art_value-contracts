require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });
const { singletons } = require('@openzeppelin/test-helpers');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ArtValueCoin = artifacts.require('ArtValueCoin');
 
module.exports = async function (deployer, network, accounts) {
  if (network === 'development') {
    await singletons.ERC1820Registry(accounts[0]);
  }

  const defaultOperators = []
  const args = ["Art_Value Coin", "AVC", defaultOperators]
  const instance = await deployProxy(ArtValueCoin, args, { deployer, initializer: 'initialize' });
  console.log(`ArtValueCoin deployed as ${instance.address}`);
};
