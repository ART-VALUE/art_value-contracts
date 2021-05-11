/**
 * Unused
 */

/*
import registerModuleAliases from 'module-alias'
registerModuleAliases()
import Web3 from "web3";
import { ArtValueCoinContract } from "@contract/ArtValueCoin";
import * as artValueCoinJson from "@contract-json/ArtValueCoin.json";
const createContractObject = require("@truffle/contract")

const ArtValueCoin = createContractObject(artValueCoinJson) as ArtValueCoinContract
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
(ArtValueCoin as any).setProvider(web3.currentProvider)

async function run() {
  const accounts = await web3.eth.getAccounts()
  const instance = await ArtValueCoin.at("0x3b7E5F64BA31ab91F2C8aF39e01F4f5fe89C107c")
  const contractOwner = accounts[0]
  const minter = accounts[6]
  const MINTER_ROLE = await instance.MINTER_ROLE()
  const hasRoleBefore = await instance.hasRole(MINTER_ROLE, minter)
  console.log(`Has role before: ${hasRoleBefore}`)
  await instance.grantRole(MINTER_ROLE, minter, { from: contractOwner })
  const hasRoleAfter = await instance.hasRole(MINTER_ROLE, minter)
  console.log(`Has role after: ${hasRoleAfter}`)
}

run().then(() => {
  process.exit()
}).catch(err => {
  console.error(err)
})
*/
