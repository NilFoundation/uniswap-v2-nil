// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {NilBase} from "./Nil.sol";

contract TokenLibrary {
    receive() external payable {}

    event TokenCreated(
        address adr,
        string _name,
        string _symbol,
        uint8 _decimals,
        uint _totalSupply,
        address _minter
    );

    event Transfer(address token, address from, address to, uint256 amount);

    struct Token {
        string name;
        string symbol;
        uint8 decimals;
        uint256 totalSupply;
        address minter;
    }

    mapping(address token => mapping(address => uint)) balances;
    mapping(address token => mapping(address => mapping(address => uint256))) allowance;

    /// @dev mapping(address tokenHash => Token) public tokens;
    mapping(address => Token) public tokens;

    constructor(){}

    function getToken(
        address _token
    )
        public
        payable
        returns (
            string memory name,
            string memory symbol,
            uint8 decimals,
            uint256 totalSupply,
            address minter
        )
    {
        Token memory t = tokens[_token];

        return (t.name, t.symbol, t.decimals, t.totalSupply, t.minter);
    }

    function transfer(
        address _token,
        address _to,
        uint _amount
    ) public payable {
        _transferFrom(_token, msg.sender, _to, _amount);
    }

    function transferFrom(
        address _token,
        address _from,
        address _to,
        uint _amount
    ) public payable {
        _transferFrom(_token, _from, _to, _amount);
    }

    function approve(
        address _token,
        address _spender,
        uint _amount
    ) public payable {
        require(
            balances[_token][msg.sender] >= _amount,
            "TokenLib: amount > balance"
        );
        allowance[_token][msg.sender][_spender] = _amount;
    }

    function balanceOf(
        address _token,
        address _adr
    ) public payable returns (uint) {
        return balances[_token][_adr];
    }

    function getBalance(
        address _token,
        address _adr
    ) public view returns (uint) {
        return balances[_token][_adr];
    }

    function mint(address _token, address _to, uint _amount) public payable {
        require(msg.sender == tokens[_token].minter, "TokenLib: not minter");
        _mint(_token, _to, _amount);
    }

    function _mint(address _token, address _to, uint _amount) internal {
        balances[_token][_to] += _amount;
        tokens[_token].totalSupply += _amount;

        emit Transfer(_token, address(0), _to, _amount);
    }

    function burn(address _token, uint _amount) public payable {
        require(
            balances[_token][msg.sender] >= _amount,
            "TokenLibrary: not enough balance"
        );

        balances[_token][msg.sender] -= _amount;
        tokens[_token].totalSupply -= _amount;

        emit Transfer(_token, msg.sender, address(0), _amount);
    }

    function newToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _totalSupply,
        address _minter
    ) public payable returns (address) {
        bytes32 tokenHash = keccak256(abi.encodePacked(_name, _symbol));

        address tokenAddress;
        assembly {
            tokenAddress := tokenHash
        }

        require(tokens[tokenAddress].totalSupply == 0, "token already exists");

        tokens[tokenAddress] = Token(
            _name,
            _symbol,
            _decimals,
            _totalSupply,
            _minter
        );

        _mint(tokenAddress, _minter, _totalSupply);

        emit TokenCreated(
            tokenAddress,
            _name,
            _symbol,
            _decimals,
            _totalSupply,
            _minter
        );
        return tokenAddress;
    }

    function _transferFrom(
        address _token,
        address _from,
        address _to,
        uint _amount
    ) internal {
        require(
            balances[_token][_from] >= _amount,
            "TokenLib: insufficient balance"
        );
        balances[_token][_from] -= _amount;
        balances[_token][_to] += _amount;

        emit Transfer(_token, _from, _to, _amount);
    }
}
