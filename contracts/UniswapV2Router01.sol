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


    constructor(address _factory) public {
        // Revert if the factory address is the zero address or an empty string
        require(_factory != address(0), "Factory address cannot be the zero address");

        factory = _factory;
    }

    function addLiquidity(
        address pair,
        address to
    ) public override {
        Nil.Token[] memory tokens = Nil.msgTokens();
        if (tokens.length != 2) {
            revert("Send only 2 tokens to add liquidity");
        }
        smartCall(pair, tokens, abi.encodeWithSignature("mint(address)", to));
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        address pair,
        address to
    ) public override {
        Nil.Token[] memory tokens = Nil.msgTokens();
        if (tokens.length != 1) {
            revert("UniswapV2Router: should contains only pair token");
        }
        smartCall(pair, tokens, abi.encodeWithSignature("burn(address)", to));
    }

    function swap(address to, address pair, uint amount0Out, uint amount1Out) public override {
        Nil.Token[] memory tokens = Nil.msgTokens();
        if (tokens.length != 1) {
            revert("UniswapV2Router: should contains only pair token");
        }
        smartCall(pair, tokens, abi.encodeWithSignature("swap(uint,uint,address)", amount0Out, amount1Out, to));
    }

    // TODO: This method are used for swapping via multiple pairs. Not supported in nil for now
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

    // TODO: This method are used for swapping via multiple pairs. Not supported in nil for now
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        address pair = IUniswapV2Factory(factory).getTokenPair(path[0], path[1]);
        Nil.Token[] memory tokens = Nil.msgTokens();
        sendCurrencyInternal(pair, tokens[0].id, amounts[0]);
        _swap(amounts, path, to);
    }

    // TODO: This method are used for swapping via multiple pairs. Not supported in nil for now
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
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

    receive() external payable {
    }

    function smartCall(address dst, Nil.Token[] memory tokens, bytes memory callData) private returns (bool) {
        if (Nil.getShardId(dst) == Nil.getShardId(address(this))) {
            (bool success,) = Nil.syncCall(dst, gasleft(), 0, tokens, callData);
            return success;
        } else {
            Nil.asyncCall(dst, address(0), address(0), 0, Nil.FORWARD_REMAINING, false, 0, tokens, callData);
            return true;
        }
    }
}