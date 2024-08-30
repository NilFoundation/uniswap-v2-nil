// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Nil.sol";
import "./Wallet.sol";

contract Faucet {
    uint256 private constant WITHDRAW_PER_TIMEOUT_LIMIT = 10**16;
    uint256 private constant TIMEOUT = 1000; // 900s == 15min

    struct LimitInfo {
        uint prevT;
        uint prevLimit;
    }
    mapping(address => LimitInfo) private limits;

//         Limit
//           ^
//           |
// max_limit +---------+  +----+        +----+     +---
//           |         | /     |       /     |    /
//           |         |/      |      /      |   /
//           |                 |  /| /       |  /
//           |                 | / |/        | /
//           |                 |/            |/
//           +-------------------------------+-----+---> Time
//                                              ^
//                                           timeout
//
//           k = max_limit / timeout
//           current_limit = min(prev_limit + delta_t * k, max_limit)
    function acquire(address addr, uint256 value) private returns (uint256) {
        LimitInfo memory limitInfo = limits[addr];

        uint256 currentT = block.number;
        uint256 currentLimit;
        if (limitInfo.prevT == 0) {
            currentLimit = WITHDRAW_PER_TIMEOUT_LIMIT;
        } else {
            uint256 deltaT = currentT - limitInfo.prevT;
            currentLimit = limitInfo.prevLimit + (WITHDRAW_PER_TIMEOUT_LIMIT / TIMEOUT) * deltaT;
            if (currentLimit > WITHDRAW_PER_TIMEOUT_LIMIT) {
                currentLimit = WITHDRAW_PER_TIMEOUT_LIMIT;
            }
        }
        uint256 acquired = value;
        if (value > currentLimit) {
            acquired = currentLimit;
        }

        limits[addr] = LimitInfo(currentT, currentLimit - acquired);

        return acquired;
    }

    event Deploy(address addr);
    event Send(address addr, uint256 value);

    function verifyExternal(uint256, bytes calldata) external pure returns (bool) {
        return true;
    }

    function withdrawTo(address payable addr, uint256 value) public {
        value = acquire(addr, value);

        bytes memory callData;
        uint feeCredit = 100_000 * tx.gasprice;
        Nil.asyncCall(
            addr,
            address(this) /* refundTo */,
            address(this) /* bounceTo */,
            feeCredit,
            Nil.FORWARD_NONE,
            false /* deploy */,
            value,
            callData);
        emit Send(addr, value);
    }

    function createWallet(bytes memory ownerPubkey, bytes32 salt, uint256 value) external returns (address) {
        Wallet wallet = new Wallet{salt: salt}(ownerPubkey);
        address addr = address(wallet);
        emit Deploy(addr);

        bool success = payable(addr).send(value);
        require(success, "Send value failed");
        emit Send(addr, value);

        return addr;
    }
}
