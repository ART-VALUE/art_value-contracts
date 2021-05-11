/**
 * Patches out the send() from Truffle.ContractInstance
 * (conflicts with ERC777.send())
 * Use sendTransaction() or web3.eth.send*() instead.
 **/
import fs from "fs"
import path from "path"
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url));

const truffleTypesRpath = "/gen/types/types.d.ts"
const truffleTypesPath = path.join(__dirname + truffleTypesRpath)
const re = /(ContractInstance \{[^\}]*?)(send[^\;]*?\;)/im

console.info("\nPatching out send() from Truffle.ContractInstance (conflicts with ERC777.send())...")
fs.readFile(truffleTypesPath, 'utf-8', (err, original) => {
  if (err != null) err
  const patched = original.toString().replace(re, "$1")
  fs.writeFile(truffleTypesPath, patched, err => {
    if (err !== null) console.error(err)
    else console.info("...done!")
  })
})
