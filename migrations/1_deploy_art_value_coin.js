const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const ArtValueCoin = artifacts.require('ArtValueCoin');

module.exports = async function (deployer) {
  const defaultOperators = []
  const args = ["Art_Value Coin", "AVC", defaultOperators]
  const instance = await deployProxy(ArtValueCoin, args, { deployer, initializer: 'initialize' });
  console.log(`ArtValueCoin deployed as ${instance.address}`);
};
