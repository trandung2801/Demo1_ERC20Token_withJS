// SPDX-License-Identifier: UNLICENSED
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract Vault is Ownable, AccessControlEnumerable {
    //state variable
    IERC20 private token; // set token
    uint256 public maxWithdrawAmount; // set max withdraw amount
    bool public withdrawEnable; // set state access withdraw
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    constructor(address initialOwner)
        Ownable(initialOwner)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    //function set variable
    function setWithdrawEnable(bool _isEnable) public onlyOwner {
        withdrawEnable = _isEnable;
    }
    function setMaxWithdrawAmount(uint256 _maxAmount) public onlyOwner {
        maxWithdrawAmount = _maxAmount;
    }

    function setToken(IERC20 _token) public onlyOwner {
        token = _token;
    }

    function withdraw(
        uint256 _amount,
        address _to
    ) external onlyWithdrawer {
        require(withdrawEnable,"Withdraw is not available");
        require(_amount<=maxWithdrawAmount,"Exceed maximum amount");
        token.transfer(_to, _amount);
    }

    function deposit(uint256 _amount) external {
        require(
            token.balanceOf(msg.sender) >= _amount,
            "Insufficient   balance"
        );
        SafeERC20.safeTransferFrom(token, msg.sender, address(this), _amount);
    }
    modifier onlyWithdrawer() {
        require(owner() == _msgSender()||hasRole(WITHDRAWER_ROLE,_msgSender()), "Caller is not a withdrawer");
        _;
    }

}