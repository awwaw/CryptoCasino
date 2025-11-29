// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SlotMachine {
    
    address public owner;
    uint256 public constant MIN_BET = 0.00001 ether;

    uint256 private nonce; 

    event SpinResult(address indexed player, uint8 r1, uint8 r2, uint8 r3, uint256 prize);
    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() payable {
        owner = msg.sender;
    }

    function spin() external payable {
        require(msg.value >= MIN_BET, "Bet too low");
        require(address(this).balance >= msg.value * 10, "Casino low on funds");

        // TODO: Make safe random using VRF
        uint8 r1 = random(1);
        uint8 r2 = random(2);
        uint8 r3 = random(3);

        nonce++;
        uint256 prize = 0;

        if (r1 == r2 && r2 == r3) {
            if (r1 == 5) {
                prize = msg.value * 10;
            } else {
                prize = msg.value * 5;
            }
        } 
        else if (r1 == r2 || r2 == r3 || r1 == r3) {
             prize = (msg.value * 150) / 100; // x1.5
        }

        if (prize > 0) {
            (bool success, ) = payable(msg.sender).call{value: prize}("");
            require(success, "Transfer failed");
        }

        emit SpinResult(msg.sender, r1, r2, r3, prize);
    }

    function random(uint256 salt) private view returns (uint8) {
        return uint8(uint256(keccak256(abi.encodePacked(
            block.timestamp, 
            msg.sender, 
            nonce, 
            salt
        ))) % 6);
    }

    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(address payable _to, uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient funds");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdraw failed");
        emit Withdraw(_to, _amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Чтобы принимать деньги напрямую
    receive() external payable {}
}
