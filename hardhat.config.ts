require("@nomicfoundation/hardhat-toolbox");
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.24",
  networks: {
    bsctest: {
      url: "https://bsc-testnet.bnbchain.org",
      accounts: [process.env.PRIV_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.API_KEY,
  },
};
