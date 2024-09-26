// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IUniswapV2Router01 {

    function addLiquidity(
        address pair,
        address to
    ) external;
    function removeLiquidity(
        address pair,
        address to
    ) external;
    function swap(
        address to,
        address pair,
        uint amount0Out,
        uint amount1Out
    ) external;

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
}