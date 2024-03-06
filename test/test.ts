import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import * as chai from "chai";
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
import { keccak256 } from "@ethersproject/keccak256";

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

function parseEther(amount: Number) {
  // return ethers.utils.parseUnits(amount.toString(), 18);
  return ethers.parseUnits(amount.toString(), 18);
}

describe("Vault", function () {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;

  let vault: Contract;
  let token: Contract;

  async function deployFixture() {
    // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    // const ONE_GWEI = 1_000_000_000;

    // const lockedAmount = ONE_GWEI;
    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // await ethers.provider.send("hardhat_reset", []);
    [owner, alice, bob, carol] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault", owner);
    const vault = await Vault.deploy(owner.address);
    const Token = await ethers.getContractFactory("Floppy", owner);
    const token = await Token.deploy(owner.address);
    await vault.setToken(token.getAddress());
    console.log("owner add: ", owner.address);
    console.log("vault add: ", vault.getAddress());
    console.log("token add: ", token.getAddress());
    return { owner, alice, bob, carol, token, vault };
  }

  ////// Happy Path
  it("Should deposit into the Vault", async () => {
    let { owner, alice, bob, carol, token, vault } = await loadFixture(
      deployFixture
    );
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(alice)
      .approve(vault.getAddress(), token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
    expect(await token.balanceOf(vault.getAddress())).equal(
      parseEther(500 * 10 ** 3)
    );
  });
  it("Should withdraw", async () => {
    let { owner, alice, bob, carol, token, vault } = await loadFixture(
      deployFixture
    );
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(alice)
      .approve(vault.getAddress(), token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

    // bob withdraw into alice address
    await vault.connect(bob).withdraw(parseEther(300 * 10 ** 3), alice.address);

    expect(await token.balanceOf(vault.getAddress())).equal(
      parseEther(200 * 10 ** 3)
    );
    expect(await token.balanceOf(alice.address)).equal(
      parseEther(800 * 10 ** 3)
    );
  });
  // ///////Unhappy Path/////////
  // it("Should not deposit, Insufficient account balance", async () => {
  //   let { owner, alice, bob, carol, token, vault } = await loadFixture(
  //     deployFixture
  //   );
  //   await token.transfer(alice.address, parseEther(1 * 10 ** 6));
  //   await token
  //     .connect(alice)
  //     .approve(vault.getAddress(), token.balanceOf(alice.address));
  //   expect(
  //     await vault.connect(alice).deposit(parseEther(2 * 10 ** 6))
  //   ).revertedWith("Insufficient account balance");
  // });
  it("Should not withdraw, Withdraw is not available ", async () => {
    //grant withdrawer role to Bob
    let { alice, vault, token } = await loadFixture(deployFixture);
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setWithdrawEnable(false);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(alice)
      .approve(vault.getAddress(), token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

    // bob withdraw into alice address
    await expect(
      vault.connect(bob).withdraw(parseEther(300 * 10 ** 3), alice.address)
    ).revertedWith("Withdraw is not available");
  });
  it("Should not withdraw, Exceed maximum amount ", async () => {
    let { alice, vault, token } = await loadFixture(deployFixture);
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(alice)
      .approve(vault.getAddress(), token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

    // bob withdraw into alice address
    await expect(
      vault.connect(bob).withdraw(parseEther(2 * 10 ** 3), alice.address)
    ).revertedWith("Exceed maximum amount");
  });
  it("Should not withdraw, Caller is not a withdrawer", async () => {
    let { alice, vault, token } = await loadFixture(deployFixture);
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setWithdrawEnable(true);
    await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 3));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    await token
      .connect(alice)
      .approve(vault.getAddress(), token.balanceOf(alice.address));
    await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));

    // bob withdraw into alice address
    await expect(
      vault.connect(carol).withdraw(parseEther(1 * 10 ** 3), alice.address)
    ).revertedWith("Caller is not a withdrawer");
  });
  // it("Should not withdraw, ERC20: transfer amount exceeds balance", async () => {
  //   let { alice, vault, token } = await loadFixture(deployFixture);
  //   //grant withdrawer role to Bob
  //   let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
  //   await vault.grantRole(WITHDRAWER_ROLE, bob.address);

  //   // setter vault functions

  //   await vault.setWithdrawEnable(true);
  //   await vault.setMaxWithdrawAmount(parseEther(5 * 10 ** 3));

  //   // alice deposit into the vault
  //   await token.transfer(alice.address, parseEther(1 * 10 ** 6));
  //   await token
  //     .connect(alice)
  //     .approve(vault.getAddress(), token.balanceOf(alice.address));
  //   await vault.connect(alice).deposit(parseEther(2 * 10 ** 3));

  //   // bob withdraw into alice address
  //   await expect(
  //     vault.connect(bob).withdraw(parseEther(3 * 10 ** 3), alice.address)
  //   ).revertedWith("ERC20: transfer amount exceeds balance");
  // });
});
