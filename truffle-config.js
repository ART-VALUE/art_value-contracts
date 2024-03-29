const HDWalletProvider = require('@truffle/hdwallet-provider');
const FixtureProvider = require('@trufflesuite/web3-provider-engine/subproviders/fixture');
const path = require('path');
require('dotenv').config()

const DEPLOYER_PRIVATE_KEY = process.env['DEPLOYER_PRIVATE_KEY']
if (DEPLOYER_PRIVATE_KEY == null) throw new Error('$DEPLOYER_PRIVATE_KEY not set')
const INFURA_PROJECT_ID = process.env['INFURA_PROJECT_ID']
if (INFURA_PROJECT_ID == null) throw new Error('$INFURA_PROJECT_ID not set')
const ETHERSCAN_API_KEY = process.env['ETHERSCAN_API_KEY']
if (ETHERSCAN_API_KEY == null) throw new Error('$ETHERSCAN_API_KEY not set')

let liveProvider = null;
createLiveProviderGetter = (infuraNetwork) => () => {
  if (liveProvider != null) return liveProvider
  const infuraUrl = `https://${infuraNetwork}.infura.io/v3/${INFURA_PROJECT_ID}`
  console.log('Infura URL: ' + infuraUrl)
  const provider = new HDWalletProvider([DEPLOYER_PRIVATE_KEY], infuraUrl)
  console.log('Infura provider addresses: ', provider.getAddresses())
  // const fixtureProvider = new FixtureProvider({
  //   'eth_getTransactionCount': (payload, next, end) => {
  //     console.log('>>>>> Handle request sign')
  //     const nonce = 25
  //     var hexNonce = nonce.toString(16)
  //     if (hexNonce.length%2) hexNonce = '0'+hexNonce
  //     hexNonce = '0x'+hexNonce
  //     end(null, hexNonce)
  //   }
  // })
  // subproviders = provider.engine._providers
  // subproviders.splice(subproviders.length - 1, 0, fixtureProvider) // Add right before last (RPC subprovider)
  // fixtureProvider.setEngine(provider.engine)
  liveProvider = provider
  return provider
}

module.exports = {
  contracts_build_directory: path.join(__dirname, "/gen/contracts"),
  migrations_directory: "./dist/migrations",
  test_directory: "./dist/test",

  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: createLiveProviderGetter('rinkeby'),
      network_id: 4,
      chainId: 4,
      // gas: 4500000,
      gasPrice: 2000000000, // too low: 40000000
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 1,
      disableConfirmationListener: true,
      networkCheckTimeout: "100000",
      websockets: false
      // timeoutBlocks: 1,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: false     // Skip dry run before migrations? (default: false for public nets )
    },
    mainnet: {
      provider: createLiveProviderGetter('mainnet'),
      network_id: 1,
      chainId: 1,
      gas: 2000000,
      gasPrice: 44000000000,
      confirmations: 0,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 800,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: false     // Skip dry run before migrations? (default: false for public nets )
    },
    // Another network with more advanced options...
    // advanced: {
    // port: 8777,             // Custom port
    // network_id: 1342,       // Custom network
    // gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
    // gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
    // from: <address>,        // Account to send txs from (default: accounts[0])
    // websocket: true        // Enable EventEmitter interface for web3 (default: false)
    // },
    // Useful for deploying to a public network.
    // NB: It's important to wrap the provider as a function.
    // ropsten: {
    // provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/YOUR-PROJECT-ID`),
    // network_id: 3,       // Ropsten's id
    // gas: 5500000,        // Ropsten has a lower block limit than mainnet
    // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
    // timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },
    // Useful for private networks
    // private: {
    // provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
    // network_id: 2111,   // This network is yours, in the cloud.
    // production: true    // Treats this network as if it was a public net. (default: false)
    // }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.7",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
       optimizer: {
         enabled: true,
         runs: 1000
       }
      }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled: false to enabled: true
  //
  // Note: if you migrated your contracts prior to enabling this field in your Truffle project and want
  // those previously migrated contracts available in the .db directory, you will need to run the following:
  // $ truffle migrate --reset --compile-all

  db: {
    enabled: false
  },

  plugins: [
    'truffle-plugin-verify'
  ],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
};
