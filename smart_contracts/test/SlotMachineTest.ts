import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SlotMachine (Simple)", function () {

  async function deployFixture() {
    const [owner, player] = await ethers.getSigners();
    
    const SlotMachine = await ethers.getContractFactory("SlotMachine");
    // Deposit 10 ETH on deploy
    const casino = await SlotMachine.deploy({ value: ethers.parseEther("10") }); 
    await casino.waitForDeployment();

    return { casino, owner, player };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { casino, owner } = await loadFixture(deployFixture);
      expect(await casino.owner()).to.equal(owner.address);
    });

    it("Should have 10 ETH balance", async function () {
        const { casino } = await loadFixture(deployFixture);
        const bal = await ethers.provider.getBalance(casino.target);
        expect(bal).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Gameplay", function () {
    it("Should play spin and emit result", async function () {
      const { casino, player } = await loadFixture(deployFixture);
      
      const bet = ethers.parseEther("0.01");

      await expect(casino.connect(player).spin({ value: bet }))
        .to.emit(casino, "SpinResult");
    });

    it("Should fail if bet is too low", async function () {
        const { casino, player } = await loadFixture(deployFixture);
        await expect(casino.connect(player).spin({ value: 0 }))
            .to.be.revertedWith("Bet too low");
    });

    it("Should fail if casino is empty", async function () {
        const SlotMachine = await ethers.getContractFactory("SlotMachine");
        const emptyCasino = await SlotMachine.deploy({ value: 0 }); // 0 денег

        const [player] = await ethers.getSigners();

        await expect(emptyCasino.connect(player).spin({ value: ethers.parseEther("1") }))
            .to.be.revertedWith("Casino low on funds");
    });
  });

  describe("Admin", function () {
      it("Should allow owner to withdraw", async function () {
          const { casino, owner } = await loadFixture(deployFixture);
          const amount = ethers.parseEther("5");
          
          await expect(casino.connect(owner).withdraw(owner.address, amount))
            .to.changeEtherBalance(owner, amount);
      });

      it("Should not allow player to withdraw", async function () {
        const { casino, player } = await loadFixture(deployFixture);
        await expect(casino.connect(player).withdraw(player.address, 100))
          .to.be.revertedWith("Only owner");
    });
  });
});
