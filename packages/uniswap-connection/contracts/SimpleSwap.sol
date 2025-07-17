// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title SimpleSwap
 * @notice A simplified Uniswap-like token swap and liquidity pool implementation
 * @dev This contract allows users to swap between two tokens and provide liquidity
 */
contract SimpleSwap is ERC20 {
    using SafeERC20 for IERC20;
    
    /// @notice Address of the first token in the trading pair
    address public token0;
    
    /// @notice Address of the second token in the trading pair
    address public token1;


    /**
     * @title SwapData
     * @notice Contains all necessary data for token swap operations
     * @dev Used to group swap-related parameters and avoid stack too deep errors
     * @member tokenIn Address of the token being swapped (input token)
     * @member tokenOut Address of the token to be received (output token)
     * @member amountIn Exact amount of input tokens to be swapped
     * @member amountOut Expected amount of output tokens to receive
     * @member reserveIn Current reserve amount of the input token in the pool
     * @member reserveOut Current reserve amount of the output token in the pool
     * @custom:usage Used in swapExactTokensForTokens and related internal functions
     */
    struct SwapData {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 reserveIn;
        uint256 reserveOut;
    }


    /**
     * @title RemoveLiqData
     * @notice Contains basic data for liquidity removal operations
     * @dev Simplified struct for removeLiquidity function parameters
     * @member tokenA Address of the first token in the pair
     * @member tokenB Address of the second token in the pair
     * @custom:usage Used in removeLiquidity and related internal functions
     */
    struct RemoveLiqData {
        address tokenA;
        address tokenB;
    }


    /**
     * @notice Emitted when liquidity is added to the pool
     * @dev Records all relevant details of a liquidity provision event
     * @param provider Address that provided the liquidity (indexed for filtering)
     * @param amountA Amount of tokenA deposited
     * @param amountB Amount of tokenB deposited
     * @param liquidity Amount of LP tokens minted to the provider
     * @custom:examples 
     * - When adding 100 TokenA and 200 TokenB, emits (provider, 100, 200, sqrt(100*200))
     */
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    

    /**
     * @notice Emitted when liquidity is removed from the pool
     * @dev Records all relevant details of a liquidity withdrawal event
     * @param provider Address that removed the liquidity (indexed for filtering)
     * @param amountA Amount of tokenA withdrawn
     * @param amountB Amount of tokenB withdrawn
     * @param liquidity Amount of LP tokens burned from the provider
     * @custom:examples 
     * - When removing 50% of LP tokens, emits (provider, reserveA/2, reserveB/2, LP/2)
     */
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    /**
     * @dev Initializes the contract with the two tokens to be traded
     * @param _token0 Address of the first token in the pair
     * @param _token1 Address of the second token in the pair
     */
    constructor(address _token0, address _token1) ERC20("Liquidity", "LIQ") {
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @notice Adds liquidity to the pool
     * @dev Mints liquidity tokens proportional to the deposited amounts
     * @param tokenA Address of first token in the pair
     * @param tokenB Address of second token in the pair
     * @param amountADesired Desired amount of tokenA to deposit
     * @param amountBDesired Desired amount of tokenB to deposit
     * @param amountAMin Minimum amount of tokenA to deposit (slippage protection)
     * @param amountBMin Minimum amount of tokenB to deposit (slippage protection)
     * @param to Address that will receive the liquidity tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amountA Actual amount of tokenA deposited
     * @return amountB Actual amount of tokenB deposited
     * @return liquidity Amount of liquidity tokens minted
     */

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address _token0 = token0;
        address _token1 = token1;
        require(deadline >= block.timestamp, "Deadline passed");
        require((tokenA == _token0 && tokenB == _token1) || (tokenA == _token1 && tokenB == _token0), "Invalid tokens");
        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));
        
        (amountA, amountB) = _calculateOptimalAmounts(
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            balanceA,
            balanceB
        );
        
        _executeDeposit(tokenA, tokenB, amountA, amountB, to);
        
        liquidity = Math.sqrt(amountA * amountB);

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @notice Calculates the optimal token amounts for liquidity deposit
     * @dev Determines the correct ratio of tokens to deposit based on current reserves
     * @param amountADesired Desired amount of token A to deposit
     * @param amountBDesired Desired amount of token B to deposit
     * @param amountAMin Minimum acceptable amount of token A (slippage protection)
     * @param amountBMin Minimum acceptable amount of token B (slippage protection)
     * @param reserveA Current reserve amount of token A in the pool
     * @param reserveB Current reserve amount of token B in the pool
     * @return amountA Optimal/actual amount of token A to deposit
     * @return amountB Optimal/actual amount of token B to deposit
     * @custom:implements 
     * - For empty pool: uses desired amounts directly
     * - For existing pool: calculates optimal ratio based on current reserves
     * - Validates amounts meet minimum requirements (slippage protection)
     */
    function _calculateOptimalAmounts(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 reserveA,
        uint256 reserveB
    ) private pure returns (uint256 amountA, uint256 amountB) {
        if (reserveA == 0 && reserveB == 0) {
            return (amountADesired, amountBDesired);
        }
        
        uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
        if (amountBOptimal <= amountBDesired) {
            require(amountBOptimal >= amountBMin, "Insufficient B amount");
            return (amountADesired, amountBOptimal);
        }
        
        uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
        require(amountAOptimal >= amountAMin, "Insufficient A amount");
        return (amountAOptimal, amountBDesired);
    }

    /**
     * @notice Executes the token transfers and mints liquidity tokens
     * @dev Performs the actual deposit operations after amounts are calculated
     * @param tokenA Address of first token in the pair
     * @param tokenB Address of second token in the pair
     * @param amountA Amount of token A to transfer
     * @param amountB Amount of token B to transfer
     * @param to Address that will receive the liquidity tokens
     * @custom:actions
     * - Transfers amountA of tokenA from sender to contract
     * - Transfers amountB of tokenB from sender to contract
     * - Mints sqrt(amountA*amountB) liquidity tokens to 'to' address
     * @custom:security 
     * - Uses SafeERC20 for secure token transfers
     * - Requires prior approval of tokens by sender
     */
    function _executeDeposit(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        address to
    ) private {
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        _mint(to, Math.sqrt(amountA * amountB));
    }

    /**
     * @notice Removes liquidity from the pool
     * @dev Burns liquidity tokens and returns the underlying assets
     * @param tokenA Address of first token in the pair
     * @param tokenB Address of second token in the pair
     * @param liquidity Amount of liquidity tokens to burn
     * @param amountAMin Minimum amount of tokenA to receive (slippage protection)
     * @param amountBMin Minimum amount of tokenB to receive (slippage protection)
     * @param to Address that will receive the underlying tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amountA Actual amount of tokenA received
     * @return amountB Actual amount of tokenB received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        address _token0 = token0;
        address _token1 = token1;
        require(deadline >= block.timestamp, "Deadline passed");
        require((tokenA == _token0 && tokenB == _token1) || (tokenA == _token1 && tokenB == _token0), "Invalid tokens");

        RemoveLiqData memory data;
        data.tokenA = tokenA;
        data.tokenB = tokenB;
        
        (amountA, amountB) = _calculateAmounts(liquidity, data.tokenA, data.tokenB);
        _validateAmounts(amountA, amountB, amountAMin, amountBMin);
        _executeRemoveLiquidity(msg.sender, to, liquidity, amountA, amountB, data.tokenA, data.tokenB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @notice Calculates the proportional token amounts for a given liquidity share
     * @dev Computes the amount of each token that corresponds to the liquidity share being withdrawn
     * @param liquidity Amount of liquidity tokens being burned/redeemed
     * @param tokenA Address of the first token in the pair
     * @param tokenB Address of the second token in the pair
     * @return amountA Proportional amount of tokenA that the liquidity represents
     * @return amountB Proportional amount of tokenB that the liquidity represents
     * @custom:math (liquidity * balanceA) / totalSupply for each token
     * @custom:security 
     * - Reads actual token balances from the contract
     * - Uses precise division to maintain proper ratios
     * - Returns amounts proportional to the pool's current reserves
     */
    function _calculateAmounts(uint256 liquidity, address tokenA, address tokenB) private view returns (uint256 amountA, uint256 amountB) {
        uint256 balanceA = IERC20(tokenA).balanceOf(address(this));
        uint256 balanceB = IERC20(tokenB).balanceOf(address(this));
        uint256 supply = totalSupply();
        return ((liquidity * balanceA) / supply, (liquidity * balanceB) / supply);
    }

    /**
     * @notice Validates that the received amounts meet minimum requirements
     * @dev Ensures the amounts satisfy the user's specified minimums (slippage protection)
     * @param amountA Actual amount of tokenA being received
     * @param amountB Actual amount of tokenB being received
     * @param amountAMin Minimum acceptable amount of tokenA
     * @param amountBMin Minimum acceptable amount of tokenB
     * @custom:reverts With "Insufficient A amount" if amountA < amountAMin
     * @custom:reverts With "Insufficient B amount" if amountB < amountBMin
     * @custom:security
     * - Protects users from front-running and excessive slippage
     * - Should be called after calculating actual withdrawal amounts
     */
    function _validateAmounts(uint256 amountA, uint256 amountB, uint256 amountAMin, uint256 amountBMin) private pure {
        require(amountA >= amountAMin, "Insufficient A amount");
        require(amountB >= amountBMin, "Insufficient B amount");
    }

    /**
     * @notice Executes the removal of liquidity by burning LP tokens and transferring underlying assets
     * @dev Handles the actual token transfers when a user withdraws liquidity from the pool
     * @param from Address from which liquidity tokens will be burned
     * @param to Address that will receive the underlying tokens
     * @param liquidity Amount of LP tokens to burn
     * @param amountA Amount of tokenA to transfer to the recipient
     * @param amountB Amount of tokenB to transfer to the recipient
     * @param tokenA Address of the first token in the pair
     * @param tokenB Address of the second token in the pair
     * @custom:actions
     * - Burns `liquidity` LP tokens from `from` address
     * - Transfers `amountA` of tokenA to `to` address
     * - Transfers `amountB` of tokenB to `to` address
     * @custom:security
     * - Requires proper authorization to burn LP tokens
     * - Uses SafeERC20 for secure token transfers
     * - Assumes proper validation of amounts was done before calling
     * @custom:events
     * - Emits Transfer event (from ERC20) when burning LP tokens
     * - Emits LiquidityRemoved event (if defined in the contract)
     */
    function _executeRemoveLiquidity(
        address from,
        address to,
        uint256 liquidity,
        uint256 amountA,
        uint256 amountB,
        address tokenA,
        address tokenB
    ) private {
        _burn(from, liquidity);
        IERC20(tokenA).safeTransfer(to, amountA);
        IERC20(tokenB).safeTransfer(to, amountB);
    }

    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible
     * @dev Uses the current pool reserves to determine the exchange rate
     * @param amountIn Exact amount of input tokens to swap
     * @param amountOutMin Minimum amount of output tokens to receive (slippage protection)
     * @param path Array with token addresses (must be length 2 for this implementation)
     * @param to Address that will receive the output tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amounts Array containing the input and output amounts
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external  returns (uint[] memory amounts) {
        address _token0 = token0;
        address _token1 = token1;
        require(deadline >= block.timestamp, "Deadline passed");
        require(path.length == 2, "Invalid path");        
        SwapData memory data;
        data.tokenIn = path[0];
        data.tokenOut = path[1];
        data.amountIn = amountIn;

        require((data.tokenIn == _token0 && data.tokenOut == _token1) || (data.tokenIn == _token1 && data.tokenOut == _token0), "Invalid tokens");
        
        _calculateReserves(data);
        data.amountOut = getAmountOut(data.amountIn, data.reserveIn, data.reserveOut);
        
        require(data.amountOut >= amountOutMin, "Insufficient output amount");
        
        _executeSwap(data, to);
        
        amounts = createAmountsArray(data.amountIn, data.amountOut);
    }

    /**
     * @notice Updates the reserve amounts in the SwapData struct with current token balances
     * @dev Reads the latest token balances from the contract and updates the reserves in memory
     * @param data SwapData struct containing:
     *        - tokenIn: Address of the input token
     *        - tokenOut: Address of the output token
     *        - reserveIn: Will be updated with current balance of input token
     *        - reserveOut: Will be updated with current balance of output token
     * @custom:operation
     * - Reads tokenIn balance from contract (updates reserveIn)
     * - Reads tokenOut balance from contract (updates reserveOut)
     * @custom:security
     * - Only reads state (view function)
     * - Uses SafeERC20 for balance checks
     * - Result is stored in memory, not storage
     * @custom:note
     * - Modifies the input struct in memory
     * - Called before swap calculations to get latest reserves
     */
    function _calculateReserves(SwapData memory data) private view {
        data.reserveIn = IERC20(data.tokenIn).balanceOf(address(this));
        data.reserveOut = IERC20(data.tokenOut).balanceOf(address(this));
    }

    /**
     * @notice Executes the token swap by transferring tokens between parties
     * @dev Performs the actual token transfers for a swap operation
     * @param data SwapData struct containing:
     *        - tokenIn: Address of the input token
     *        - tokenOut: Address of the output token
     *        - amountIn: Amount of input tokens being swapped
     *        - amountOut: Amount of output tokens to be received
     * @param to Address that will receive the output tokens
     * @custom:actions
     * - Transfers `amountIn` of `tokenIn` from sender to this contract
     * - Transfers `amountOut` of `tokenOut` from contract to receiver
     * @custom:security
     * - Uses SafeERC20 for secure token transfers
     * - Requires prior approval of input tokens by sender
     * - Assumes proper amount checks were done before calling
     */
    function _executeSwap(SwapData memory data, address to) private {
        IERC20(data.tokenIn).safeTransferFrom(msg.sender, address(this), data.amountIn);
        IERC20(data.tokenOut).safeTransfer(to, data.amountOut);
    }

    /**
     * @notice Creates an amounts array for swap operations
     * @dev Constructs a fixed-size array to return swap input/output amounts
     * @param amountIn Exact amount of input tokens being swapped
     * @param amountOut Calculated amount of output tokens
     * @return amounts Fixed-size array where:
     *         - amounts[0] = input amount (amountIn)
     *         - amounts[1] = output amount (amountOut)
     * @custom:usage Used to maintain compatibility with swap function return signatures
     * @custom:note Array format matches common DEX interfaces
     */
    function createAmountsArray(uint256 amountIn, uint256 amountOut) private pure returns (uint[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
        return amounts;
    }

    /**
     * @notice Returns the current price ratio between two tokens
     * @dev Price is expressed as tokenB per tokenA, scaled by 1e18
     * @param tokenA Address of the base token
     * @param tokenB Address of the quote token
     * @return price Price ratio (tokenB/tokenA) multiplied by 1e18
     */
    function getPrice(address tokenA, address tokenB) external view returns (uint256 price) {
        uint256 reserveA = IERC20(tokenA).balanceOf(address(this));
        uint256 reserveB = IERC20(tokenB).balanceOf(address(this));
        price = (reserveB * 1e18) / reserveA;
    }

    /**
     * @notice Calculates the amount of output tokens for a given input
     * @dev Uses a simple constant product formula (x*y=k)
     * @param amountIn Amount of input tokens
     * @param reserveIn Reserve amount of input tokens
     * @param reserveOut Reserve amount of output tokens
     * @return amount Calculated amount of output tokens
     */
    function getAmountOut(
        uint amountIn, 
        uint reserveIn, 
        uint reserveOut
    ) public pure returns (uint256 amount) {
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = amountIn + reserveIn;
        require(denominator > 0, "No division");
        amount = (numerator * 1e18) / denominator;
    }
}