// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IUniswapV2Pair.sol";
import "./UniswapV2ERC20.sol";
import "./libraries/TokenLibrary.sol";
import "./libraries/Math.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Callee.sol";
import {NilBase} from "./Nil.sol";

contract UniswapV2Pair is NilBase, IUniswapV2Pair, UniswapV2ERC20 {
    using SafeMath for uint;

    uint public constant MINIMUM_LIQUIDITY = 10 ** 3;
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));

    address payable public tokenLib;
    address public lpToken;

    address public factory;
    address public token0;
    address public token1;

    uint256 private reserve0; // uses single storage slot, accessible via getReserves
    uint256 private reserve1; // uses single storage slot, accessible via getReserves
    uint32 private blockTimestampLast; // uses single storage slot, accessible via getReserves

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "UniswapV2: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function getReserves()
        public
        view
        returns (uint256 _reserve0, uint256 _reserve1)
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
    }

    function _safeTransfer(address _token, address _to, uint _value) private {
        TokenLibrary(tokenLib).transfer(_token, _to, _value);
    }

    constructor() payable {
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(address _token0, address _token1) public payable {
        token0 = _token0;
        token1 = _token1;
    }

    function setTokenLib(address payable _tokenLib) public payable {
        tokenLib = _tokenLib;

        (string memory token0Name, , , , ) = TokenLibrary(tokenLib).getToken(
            token0
        );
        (string memory token1Name, , , , ) = TokenLibrary(tokenLib).getToken(
            token1
        );

        lpToken = TokenLibrary(tokenLib).newToken(
            string(abi.encodePacked(token0Name, "-", token1Name)),
            "LP",
            18,
            0,
            address(this)
        );
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(
        uint balance0,
        uint balance1,
        uint256 _reserve0,
        uint256 _reserve1
    ) internal {
        // require(
        //     balance0 <= type(uint112).max && balance1 <= type(uint112).max,
        //     "UniswapV2: OVERFLOW"
        // );
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        //uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        //if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            // // * never overflows, and + overflow is desired
            // price0CumulativeLast +=
            //     uint(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) *
            //     timeElapsed;
            // price1CumulativeLast +=
            //     uint(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) *
            //     timeElapsed;
        //}

        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = blockTimestamp;

       // emit Sync(reserve0, reserve1);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(
        uint256 _reserve0,
        uint256 _reserve1
    ) private returns (bool feeOn) {
        // address feeTo = IUniswapV2Factory(factory).feeTo();
        // feeOn = feeTo != address(0);
        address feeTo = address(0);
        feeOn = false;
        uint _kLast = kLast; // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint rootK = Math.sqrt(uint(_reserve0).mul(_reserve1));
                uint rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint numerator = totalSupply.mul(rootK.sub(rootKLast));
                    uint denominator = rootK.mul(5).add(rootKLast);
                    uint liquidity = numerator / denominator;
                    if (liquidity > 0)
                        TokenLibrary(tokenLib).mint(lpToken, feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) public payable lock returns (uint liquidity) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves(); // gas savings
        uint balance0 = TokenLibrary(tokenLib).balanceOf(token0, address(this));
        uint balance1 = TokenLibrary(tokenLib).balanceOf(token1, address(this));
        uint amount0 = balance0.sub(_reserve0);
        uint amount1 = balance1.sub(_reserve1);
        // bool feeOn = _mintFee(_reserve0, _reserve1);
        uint _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee

        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            TokenLibrary(tokenLib).mint(
                lpToken,
                address(0),
                (MINIMUM_LIQUIDITY)
            ); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                amount0.mul(_totalSupply) / _reserve0,
                amount1.mul(_totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED");

        TokenLibrary(tokenLib).mint(lpToken, to, liquidity);
        _update(balance0, balance1, _reserve0, _reserve1);
        // if (feeOn) kLast = uint(reserve0).mul(reserve1); // reserve0 and reserve1 are p-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(
        address to
    ) public payable lock returns (uint amount0, uint amount1) {
        (uint256 _reserve0, uint256 _reserve1) = getReserves(); // gas savings
        address _token0 = token0; // gas savings
        address _token1 = token1; // gas savings
        uint balance0 = TokenLibrary(tokenLib).balanceOf(
            _token0,
            address(this)
        );
        uint balance1 = TokenLibrary(tokenLib).balanceOf(
            _token1,
            address(this)
        );
        uint liquidity = TokenLibrary(tokenLib).balanceOf(
            lpToken,
            address(this)
        );
        bool feeOn = _mintFee(_reserve0, _reserve1);
        (, , , uint _totalSupply, ) = TokenLibrary(tokenLib).tokens(lpToken); // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(
            amount0 > 0 && amount1 > 0,
            "UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED"
        );
        TokenLibrary(tokenLib).burn(lpToken, liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = TokenLibrary(tokenLib).balanceOf(_token0, address(this));
        balance1 = TokenLibrary(tokenLib).balanceOf(_token1, address(this));
        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, amount0, amount1, to);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) public payable lock {
        require(
            amount0Out > 0 || amount1Out > 0,
            "UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        (uint256 _reserve0, uint256 _reserve1) = getReserves(); // gas savings
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            "UniswapV2: INSUFFICIENT_LIQUIDITY"
        );
        uint balance0;
        uint balance1;
        balance0 = TokenLibrary(tokenLib).balanceOf(token0, address(this));
        balance1 = TokenLibrary(tokenLib).balanceOf(token1, address(this));
        {
            // scope for _token{0,1}, avoids stack too deep errors
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "UniswapV2: INVALID_TO");
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
            if (data.length > 0)
                IUniswapV2Callee(to).uniswapV2Call(
                    msg.sender,
                    amount0Out,
                    amount1Out,
                    data
                );
            balance0 = TokenLibrary(tokenLib).balanceOf(_token0, address(this));
            balance1 = TokenLibrary(tokenLib).balanceOf(_token1, address(this));
        }
        uint amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;
        require(
            amount0In > 0 || amount1In > 0,
            "UniswapV2: INSUFFICIENT_INPUT_AMOUNT"
        );
        {
            // scope for reserve{0,1}Adjusted, avoids stack too deep errors
            uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(3));
            uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(3));
            require(
                balance0Adjusted.mul(balance1Adjusted) >=
                    uint(_reserve0).mul(_reserve1).mul(1000 ** 2),
                "UniswapV2: K"
            );
        }
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // force balances to match reserves
    function skim(address to) public payable lock {
        address _token0 = token0; // gas savings
        address _token1 = token1; // gas savings
        _safeTransfer(
            _token0,
            to,
            TokenLibrary(tokenLib).balanceOf(_token0, address(this)).sub(
                reserve0
            )
        );
        _safeTransfer(
            _token1,
            to,
            TokenLibrary(tokenLib).balanceOf(_token1, address(this)).sub(
                reserve1
            )
        );
    }

    // force reserves to match balances
    function sync() public payable lock {
        _update(
            TokenLibrary(tokenLib).balanceOf(token0, address(this)),
            TokenLibrary(tokenLib).balanceOf(token1, address(this)),
            reserve0,
            reserve1
        );
    }

    receive() external payable {}
}
