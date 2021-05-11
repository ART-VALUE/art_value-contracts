# Art_Value Contracts

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

Run ganache-cli (separate terminal)
```
ganache-cli
```

Run tests
```
npm run test
```
