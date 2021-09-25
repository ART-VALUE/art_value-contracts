# Art_Value Contracts

## Live versions

* [**Rinkeby**: 0x310411ceda6235ad7ce6e8db3febc95870af8892](https://rinkeby.etherscan.io/address/0x310411ceda6235ad7ce6e8db3febc95870af8892)
* [**Mainnet**: 0x15803e5557274268b919816a29798b37fdd2279d](https://etherscan.io/address/0x15803e5557274268b919816a29798b37fdd2279d)

## Building

Building occurs in three steps:
1. Compiling solidity contracts to truffle contract jsons (gen/contracts)
2. Generating TypeScript type definitions using typechain (gen/types)
3. Build the src folder

Run:
```
npm run build
```

## Testing

Run ganache-cli (as background job or in separate terminal)
```
npm run ganache-cli
```

Run tests
```
npm run test
```

If you didn't touch anything in `contracts/` (only edits in `src/`), it's
 ok to run: `npm run build-ts` instead of `npm run build` (so
  `npm run build-ts && npm run test` as a one-liner).

## Deploying

On development net (ganache-cli):
```
npm run migrate
```

On rinkeby:
```
npm run migrate -- --network rinkeby
```

## Interacting with deployed contract

Open truffle console:
```
npm run truffle-console -- --network rinkeby
```

Get contract reference:
```
truffle(rinkeby)> const av = await ArtValueV1.at('<address>')
```

Do stuff:
```
truffle(rinkeby)> av.numberBaseURI()
'https://artvalue.org/m/n/'
```

## OpenZeppelin Upgradeable

Both Arts and ArtValue use OpenZeppelin's "Upgradeable" framework.

Read more about it here: https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable

The three deployed contracts are:

- `<contract name>`: Implementation contract. **Never call methods on this contract** (or you will loose stored data when upgrading). Their exists one deployed contract for each implementation version.

- TransparentUpgradeableProxy: Proxy. Dispatches to implementation contract. The actual data on the blockchain is stored in this contract. Always call implementation methods on this contract (even though Etherscan does not show them).

- ProxyAdmin: Used to manage the proxy. You can query for the current implementation address of a proxy using getProxyImplementation().

## Verifying

To verify a deployed contract, use [truffle-plugin-verify](https://www.npmjs.com/package/truffle-plugin-verify) as such:

```
npm run truffle -- run verify <contract name>@<contract address> --network <network name>
```

e.g.

```
npm run truffle -- run verify TransparentUpgradeableProxy@0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF --network rinkeby
npm run truffle -- run verify ArtValueV1@0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF --network rinkeby
```

## Upgrading

1. Make a copy of the contract you want to upgrade and increase its version number
2. Make the necessary changes to that copy
3. Add a migration script similar to `src/migrations/2_upgrade_to_ArtValueV2`
