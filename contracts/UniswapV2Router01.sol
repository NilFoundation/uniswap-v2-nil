// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IUniswapV2Router01.sol';
import './interfaces/IUniswapV2Factory.sol';
import './libraries/UniswapV2Library.sol';
import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";
import "@nilfoundation/smart-contracts/contracts/Nil.sol";
import "./interfaces/IUniswapV2Pair.sol";

contract UniswapV2Router01 is IUniswapV2Router01, NilCurrencyBase {
    address public immutable factory;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'UniswapV2Router: EXPIRED');
        _;
    }

    constructor(address _factory) public {
        // Revert if the factory address is the zero address or an empty string
        require(_factory != address(0), "Factory address cannot be the zero address");

        factory = _factory;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        address to,
        uint deadline,
        uint salt
    ) external override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        if (IUniswapV2Factory(factory).getTokenPair(tokenA, tokenB) == address(0)) {
            IUniswapV2Factory(factory).createPair(tokenA, tokenB, 1, salt);
        }
        address pair = IUniswapV2Factory(factory).getTokenPair(tokenA, tokenB);
        uint tokenAId = NilCurrencyBase(tokenA).getCurrencyId();
        uint tokenBId = NilCurrencyBase(tokenB).getCurrencyId();

        Nil.Token[] memory tokens = Nil.msgTokens();
        if (tokens.length != 2) {
            revert("Send only 2 tokens to add liquidity");
        }
        assert(tokenAId == tokens[0].id);
        assert(tokenBId == tokens[1].id);

        if (tokens.length != 2) {
            revert("UniswapV2Router: Expect 2 tokens to add liquidity");
        }
        sendCurrencyInternal(pair, tokenAId, tokens[0].amount);
        sendCurrencyInternal(pair, tokenBId, tokens[1].amount);
        liquidity = IUniswapV2Pair(pair).mint(to);
        amountA = tokens[0].amount;
        amountB = tokens[1].amount;
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = IUniswapV2Factory(factory).getTokenPair(tokenA, tokenB);
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
        Nil.Token[] memory tokens = Nil.msgTokens();
        if (tokens.length != 1) {
            revert("UniswapV2Router: should contains only pair token");
        }
        sendCurrencyInternal(pair, tokens[0].id, tokens[0].amount); // send liquidity to pair
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) private {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < path.length - 2 ? IUniswapV2Factory(factory).getTokenPair(output, path[i + 2]) : _to;
            address pair = IUniswapV2Factory(factory).getTokenPair(input, output);
            IUniswapV2Pair(pair).swap(amount0Out, amount1Out, to);
        }
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        address pair = IUniswapV2Factory(factory).getTokenPair(path[0], path[1]);
        Nil.Token[] memory tokens = Nil.msgTokens();
        sendCurrencyInternal(pair, tokens[0].id, amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external override ensure(deadline) returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        address pair = IUniswapV2Factory(factory).getTokenPair(path[0], path[1]);
        Nil.Token[] memory tokens = Nil.msgTokens();
        sendCurrencyInternal(pair, tokens[0].id, amounts[0]);
        _swap(amounts, path, to);
    }

    function quote(uint amountA, uint reserveA, uint reserveB) public pure override returns (uint amountB) {
        return UniswapV2Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure override returns (uint amountOut) {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) public pure override returns (uint amountIn) {
        return UniswapV2Library.getAmountOut(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path) public view override returns (uint[] memory amounts) {
        return UniswapV2Library.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path) public view override returns (uint[] memory amounts) {
        return UniswapV2Library.getAmountsIn(factory, amountOut, path);
    }

    receive() external payable {
    }
}