# Defi Alyra - Uniswap Fork + Masterchef fork + Stacking

![alt TEST defi](01_RTeam.jpg)


## Install instructions

In the root folder, run `npm install`

Open a console and start your `ganache-cli -b 1` instance

Open a new console and migrate contracts with `truffle migrate` or `truffle migrate --reset`

Then go to script folder with `cd script/` and run the script to simulate workflow, in order :

- **1** : `truffle exec 1_mamieswap.js` (use ctrl+c to leave the script)
- **2** : `truffle exec 2_masterchef.js` (use ctrl+c to leave the script)
- **3** : `truffle exec 3_staking.js` (use ctrl+c to leave the script)
<p>&nbsp;</p>

## Web UI

- **1** : Go to client/ folder (from project root: cd client) and run `npm install` (install dependencies)

- **2** : Wallet : Go to your default Browser and connect a wallet (example: Metamask).

- **3** : `npm start` to run your local instance - you will see : running server ...

- **4** : Browser: your default browser will start with a new window or tab. 

  :warning: =>> If you encounter any errors related to webpack versions, you can do the following:
    - ->> rename file env-client-sample as ".env".
    - ->> stop server with <Ctrl ^C> and run 'npm start' again. 

<p>&nbsp;</p>

# `Code details`

All contracts have been migrated to Solidity 0.8.10

### **Uniswap contracts**

| Uniswap name      | Renamed               |
| ----------------- | :-------------------- |
| UniswapV2ERC20    | MamieCryptoV2ERC20    |
| UniswapV2Factory  | MamieCryptoV2Factory  |
| UniswapV2Pair     | MamieCryptoV2Pair     |
| UniswapV2Router02 | MamieCryptoV2Router02 |

### **Sushi masterchef**    :sushi: 

Localted in folder `contracts/MasterChef`, you will find `Masterchef.sol` and `MCTO.sol`
Forked from: [*`MasterChef.sol`*](https://github.com/sushiswap/sushiswap/blob/canary/contracts/MasterChef.sol)

You can stake in it any LP tokens from Uniswap liquidity pools and you will earn MCTO tokens.

Rewards are 10 MCTO / block for all pools.

### **Staking**

Contract is located in `contracts/Staking` folder and called `MCTOBar.sol`

In MCTO bar you can deposit your MCTO tokens and receive stkMCTO. It will accrued more MCTO over time.

ENJOY SOME SUSHIs :sushi: and Smile :joy:


