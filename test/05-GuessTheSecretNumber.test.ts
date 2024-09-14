import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('GuessTheSecretNumberChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('GuessTheSecretNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    const answerHash = '0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365';

    // We brute force all possible values of uint8 (0 to 255) to find the correct number
    let correctAnswer;
    for (let i = 0; i <= 255; i++) {
      const hash = ethers.utils.keccak256([i]);
      if (hash === answerHash) {
        correctAnswer = i;
        break;
      }
    }

    await target.connect(attacker).guess(correctAnswer, {
      value: utils.parseEther('1'),
    });

    expect(await target.isComplete()).to.equal(true);
  });
});
