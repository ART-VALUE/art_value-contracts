// migrations/2_deploy.js
const AVN = artifacts.require('ArtValueNumber.sol');

module.exports = async function (deployer) {
  await deployer.deploy(AVN);
};