// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;
 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GetLastPrice.sol";


contract OBdefiStaking {
   
    // Constants
    uint public constant STAKING_RATE = 6;
    // define here what the rate refers to. Usually it would be a year = 52 weeks in solidity
    // but for test purpose it can be easier to use shorter period like one day
    uint public constant STAKING_PERIODICITY = 1 days;
       
    // will store an entry information
    // - stakedAmount = sum of staked amount less sum of withdrawn amounts
    // - previousStakedAmountPerSecond = necessary to calculate reward without the need to keep a sub-array per token
    // - lastTransactionDate: last date to use for calculation
    struct Token {
        address tokenAddress;
        uint stakedAmount;
        uint previousStakedAmountPerSecond;
        uint lastTransactionDate;
    }
    Token[] public tokens;
    mapping(address => uint) public tokenMap;
    
    //GetLastPrice - il est recommandé de faire le calcul de prix à l'extérieur car pas fiable dans le SC 
    // vu dans la doc :) 
    GetLastPrice private priceLatest = new GetLastPrice();

    /// @notice calculate staked amount per second
    /// @param token struct containing the necessary information
    /// @return uint
    function getNewStakedAmountPerSecond (Token memory token) private view returns (uint){
        return token.previousStakedAmountPerSecond + ((block.timestamp - token.lastTransactionDate) * token.stakedAmount);
    }

    /// @notice calculate reward based on token parameter
    /// @param token struct containing the necessary information
    /// @return an uint
    function calculateReward (Token memory token) private view returns (uint){
        return ((getNewStakedAmountPerSecond(token) * STAKING_RATE) / STAKING_PERIODICITY) / 100;
    }
    
    function GetStakingRate () public view returns (uint) {
        return STAKING_RATE;
    }

    function GetStakingPeriodicity () public view returns (uint) {
        return STAKING_PERIODICITY;
    }
    
    function GetStakedTokens () public view returns (Token[] memory) {
        return tokens;
    }

    /// @notice Stake an amount of a specific ERC20 token
    /// @param tokenAddress address of the staked token
    /// @param amount staked amount
    function stakeToken (address tokenAddress, uint amount) public {
        require(amount > 0, "You cannot stake 0 token");

        int arrayIndex = int(tokenMap[tokenAddress]) - 1;
        if (arrayIndex == -1) {
            tokens.push(Token(tokenAddress, amount, 0, block.timestamp));
            tokenMap[tokenAddress] = tokens.length;
        }
        else {
            Token storage currentToken = tokens[uint(arrayIndex)];
            currentToken.previousStakedAmountPerSecond = getNewStakedAmountPerSecond(currentToken);
            currentToken.stakedAmount += amount;
            currentToken.lastTransactionDate = block.timestamp;
        }

        // transfer amount from stakeholder to the contract
        // attn : approuve du contrat avant : 
        // stakeholder will have first approved (minimum = amount) the contract to transfer tokens from its address
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
    }
    
    /// @notice Withdraw an amount of a specific ERC20 token
    /// @param tokenAddress address of the staked token
    /// @param amount amount to be withdrawn
    function unstakeToken (address tokenAddress, uint amount) public {
        require(amount > 0, "You cannot withdraw 0 token");

        int arrayIndex = int(tokenMap[tokenAddress]) - 1;
        require(arrayIndex > -1, "No staked token on this contract");
        
        Token storage currentToken = tokens[uint(arrayIndex)];
        require(currentToken.stakedAmount >= amount, "Not enough staked tokens.");
        
        currentToken.previousStakedAmountPerSecond = getNewStakedAmountPerSecond(currentToken);
        currentToken.lastTransactionDate = block.timestamp;
        currentToken.stakedAmount -= amount;

        // transfer amount back to stakeholder
        IERC20(tokenAddress).transfer(msg.sender, amount);
    }
    
    /// @notice indicate the total staked amount of a given token 
    /// @param tokenAddress address of the staked token
    /// @return uint
    function getTokenStakedAmount (address tokenAddress) public view returns (uint) {
        int arrayIndex = int(tokenMap[tokenAddress]) - 1;
        if (arrayIndex == -1) {
            return 0;
        }
        else {
            return tokens[uint(arrayIndex)].stakedAmount;
        }
    }

    /// @notice calculate reward amount for a given token
    /// @param tokenAddress address of the staked token
    /// @return uint
    function getTokenReward (address tokenAddress) public view returns (uint) {
        int arrayIndex = int(tokenMap[tokenAddress]) - 1;
        if (arrayIndex == -1) {
            return 0;
        }
        else {
            return calculateReward(tokens[uint(arrayIndex)]);
        }
    }
    
    // voir si besoin de cette fct ...  pas de rinkeby 
    /// @notice factory to give chainlink data feed address for Rinkeby testnet
    /// @param sourceTokenSymbol symbol of the token
    /// @return an address
    function getDataFeedAddressToETH (string memory sourceTokenSymbol) private pure returns (address) {
        if(keccak256(bytes(sourceTokenSymbol)) == keccak256(bytes("BTC"))) {
            return address(0xc751E86208F0F8aF2d5CD0e29716cA7AD98B5eF5);
        }
        else if(keccak256(bytes(sourceTokenSymbol)) == keccak256(bytes("DAI"))) {
            return address(0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D);
        }
        else if(keccak256(bytes(sourceTokenSymbol)) == keccak256(bytes("USDC"))) {
            return address(0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf);
        }
        else {
            return address(0);
        }
    }
    
    /// @notice returns the corresponding Rinkeby chainlink price for a token
    /// @dev note: for test purpose it also returns 30 for "OBS" - 40 for "MCTO" 
    /// @param tokenAddress address of the staked token
    /// @return uint
    function getTokenPrice (address tokenAddress) public view returns (int) {
        try ERC20(tokenAddress).symbol() returns (string memory tokenSymbol) {
            address datafeedAddress = getDataFeedAddressToETH(tokenSymbol);
            if (datafeedAddress == address(0)) {
                if (keccak256(bytes(tokenSymbol)) == keccak256(bytes("OBS"))) {
                    return 30;
                }
                else if (keccak256(bytes(tokenSymbol)) == keccak256(bytes("MCTO"))) {
                    return 40;
                }
                else {
                    return 0;
                }
            }
            else {

                // calcul externe du dernier prix - 
                try priceLatest.getLatestPrice(tokenAddress) returns (int price) {
                    return price;
                } catch {
                    return 0;
                }
            }
        }
        catch {
            return 0;
        }
    }
    
    /// @notice returns the total stake reward price in ETH
    /// @return uint
    function getAllTokensRewardsInETH () public view returns (uint) {
        uint totalRewardsInETH;
        for (uint tokenCounter=0; tokenCounter<tokens.length; tokenCounter++) {
            Token storage currentToken = tokens[tokenCounter];
            totalRewardsInETH += calculateReward(currentToken) * uint(getTokenPrice(currentToken.tokenAddress));
        }
        return totalRewardsInETH;
    }
}
