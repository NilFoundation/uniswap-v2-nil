// SPDX-License-Identifier: MIT
pragma solidity =0.5.16;

contract TokenLibrary {
    event TokenCreated(
        address adr,
        string _name,
        string _symbol,
        uint8 _decimals,
        uint _totalSupply,
        address _minter
    );

    struct Token {
        string name;
        string symbol;
        uint8 decimals;
        uint256 totalSupply;
        address minter;
        mapping(address => uint) balances;
        mapping(address => mapping(address => uint256)) allowance;
    }

    /// @dev mapping(address tokenHash => Token) public tokens;
    mapping(address => Token) public tokens;

    function transfer(address _token, address _to, uint _amount) public {
        _transferFrom(_token, msg.sender, _to, _amount);
    }

    function transferFrom(
        address _token,
        address _from,
        address _to,
        uint _amount
    ) public {
        require(
            tokens[_token].allowance[_from][msg.sender] >= _amount,
            "TokenLib: insufficient allowance"
        );
        _transferFrom(_token, _from, _to, _amount);
    }

    function approve(address _token, address _spender, uint _amount) public {
        require(
            tokens[_token].balances[msg.sender] >= _amount,
            "TokenLib: amount > balance"
        );
        tokens[_token].allowance[msg.sender][_spender] = _amount;
    }

    function allowance(
        address _token,
        address _holder,
        address _spender
    ) public view returns (uint) {
        return tokens[_token].allowance[_holder][_spender];
    }

    function balanceOf(
        address _token,
        address _adr
    ) public view returns (uint) {
        return tokens[_token].balances[_adr];
    }

    function mint(address _token, address _to, uint _amount) public {
        require(msg.sender == tokens[_token].minter, "TokenLib: not minter");
        _mint(_token, _to, _amount);
    }

    function _mint(address _token, address _to, uint _amount) internal {
        tokens[_token].balances[_to] += _amount;
        tokens[_token].totalSupply += _amount;
    }

    function burn(address _token, uint _amount) public {
        require(
            tokens[_token].balances[msg.sender] >= _amount,
            "TokenLibrary: not enough balance"
        );

        tokens[_token].balances[msg.sender] -= _amount;
        tokens[_token].totalSupply -= _amount;
    }

    function newToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _totalSupply,
        address _minter
    ) public returns (address) {
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
            tokens[_token].balances[_from] >= _amount,
            "TokenLib: insufficient balance"
        );
        tokens[_token].balances[_from] -= _amount;
        tokens[_token].balances[_to] += _amount;
    }
}
