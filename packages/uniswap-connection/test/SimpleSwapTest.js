const { ethers } = require('hardhat');
const { expect } = require('chai');
const { parseEther } = ethers;

describe('SimpleSwap', () => {
    let SimpleSwap;
    let simpleSwap;

    let Token0;
    let token0;

    let Token1;
    let token1;

    let owner, user1;

    beforeEach(async () => {
        [owner, user1] = await ethers.getSigners();

        Token0 = await ethers.getContractFactory("TokenA");
        Token1 = await ethers.getContractFactory("TokenB");
        token0 = await Token0.deploy(owner.address, owner.address);
        token1 = await Token1.deploy(owner.address, owner.address);
        
        SimpleSwap = await ethers.getContractFactory("SimpleSwap");
        simpleSwap = await SimpleSwap.deploy(token0.target, token1.target);

        const initialBalance = parseEther("1000");
        await token0.transfer(user1.address, initialBalance);
        await token1.transfer(user1.address, initialBalance);
    });

    describe('Constructor', () => {
        it('should set the correct token pairs', async () => {
            expect(await simpleSwap.token0()).to.equal(token0.target);
            expect(await simpleSwap.token1()).to.equal(token1.target);
        });

        it('should set the correct token name and symbol', async () => {
            expect(await simpleSwap.name()).to.equal("Liquidity");
            expect(await simpleSwap.symbol()).to.equal("LIQ");
        });
    });

    describe('addLiquidity', () => {
        it('should mint liquidity tokens when adding liquidity to empty pool', async () => {
            const amountA = parseEther("100");
            const amountB = parseEther("100");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;

            await expect(
                simpleSwap.connect(owner).addLiquidity(
                    token0.target,
                    token1.target,
                    amountA,
                    amountB,
                    0,
                    0,
                    owner.address,
                    deadline
                )
            ).to.emit(simpleSwap, 'Transfer').withArgs(ethers.ZeroAddress, owner.address, parseEther("100"));

            expect(await simpleSwap.balanceOf(owner.address)).to.equal(parseEther("100"));
            expect(await token0.balanceOf(simpleSwap.target)).to.equal(amountA);
            expect(await token1.balanceOf(simpleSwap.target)).to.equal(amountB);
        });

        it('should mint liquidity tokens with optimal amounts when pool has reserves', async () => {
            // First add liquidity
            const initialAmount = parseEther("100");
            await token0.connect(owner).approve(simpleSwap.target, initialAmount);
            await token1.connect(owner).approve(simpleSwap.target, initialAmount);
            
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).addLiquidity(
                token0.target,
                token1.target,
                initialAmount,
                initialAmount,
                0,
                0,
                owner.address,
                deadline
            );

            const newAmountA = parseEther("200");
            const newAmountB = parseEther("100");
            await token0.connect(user1).approve(simpleSwap.target, newAmountA);
            await token1.connect(user1).approve(simpleSwap.target, newAmountB);

            const tx = await simpleSwap.connect(user1).addLiquidity(
                token0.target,
                token1.target,
                newAmountA,
                newAmountB,
                0,
                0,
                user1.address,
                deadline
            );

            // Should use optimal amount (100 token1 for 200 token0)
            expect(await simpleSwap.balanceOf(user1.address)).to.be.closeTo(
                parseEther("100"), 
                parseEther("1")
            );
        });

        it('should revert if deadline has passed', async () => {
            const amountA = parseEther("100");
            const amountB = parseEther("100");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const expiredDeadline = (await ethers.provider.getBlock('latest')).timestamp - 1;

            await expect(
                simpleSwap.connect(owner).addLiquidity(
                    token0.target,
                    token1.target,
                    amountA,
                    amountB,
                    0,
                    0,
                    owner.address,
                    expiredDeadline
                )
            ).to.be.revertedWith("Deadline passed");
        });

        it('should revert if invalid tokens are provided', async () => {
            const amountA = parseEther("100");
            const amountB = parseEther("100");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;

            await expect(
                simpleSwap.connect(owner).addLiquidity(
                    token0.target,
                    token0.target,
                    amountA,
                    amountB,
                    0,
                    0,
                    owner.address,
                    deadline
                )
            ).to.be.revertedWith("Invalid tokens");
        });


        it('should emit LiquidityAdded event when adding liquidity', async () => {
            const amountA = parseEther("100");
            const amountB = parseEther("100");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;

            await expect(
                simpleSwap.connect(owner).addLiquidity(
                    token0.target,
                    token1.target,
                    amountA,
                    amountB,
                    0,
                    0,
                    owner.address,
                    deadline
                )
            )
            .to.emit(simpleSwap, 'LiquidityAdded')
            .withArgs(
                owner.address,
                amountA,
                amountB,
                parseEther("100") // liquidity tokens minted (sqrt(100*100) = 100
            );
        });
    });

    describe('removeLiquidity', () => {
        beforeEach(async () => {
            // Add initial liquidity
            const amountA = parseEther("100");
            const amountB = parseEther("100");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).addLiquidity(
                token0.target,
                token1.target,
                amountA,
                amountB,
                0,
                0,
                owner.address,
                deadline
            );
        });

        it('should burn liquidity tokens and return underlying assets', async () => {
            const initialLiquidity = await simpleSwap.balanceOf(owner.address);
            const initialToken0Balance = await token0.balanceOf(owner.address);
            const initialToken1Balance = await token1.balanceOf(owner.address);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).removeLiquidity(
                token0.target,
                token1.target,
                initialLiquidity,
                0,
                0,
                owner.address,
                deadline
            );

            // Check liquidity tokens burned
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(0);

            // Check tokens returned
            const finalToken0Balance = await token0.balanceOf(owner.address);
            const finalToken1Balance = await token1.balanceOf(owner.address);

            expect(finalToken0Balance).to.be.closeTo(
                initialToken0Balance + parseEther("100"),
                parseEther("1")
            );
            expect(finalToken1Balance).to.be.closeTo(
                initialToken1Balance + parseEther("100"),
                parseEther("1")
            );
        });

        it('should revert if output amount is below minimum', async () => {
            const initialLiquidity = await simpleSwap.balanceOf(owner.address);
            
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            
            await expect(
                simpleSwap.connect(owner).removeLiquidity(
                    token0.target,
                    token1.target,
                    initialLiquidity,
                    parseEther("101"),
                    parseEther("101"),
                    owner.address,
                    deadline
                )
            ).to.be.revertedWith("Insufficient A amount");
        });


        it('should emit LiquidityRemoved event when removing liquidity', async () => {
            const liquidityToRemove = parseEther("50");
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;

            await expect(
                simpleSwap.connect(owner).removeLiquidity(
                    token0.target,
                    token1.target,
                    liquidityToRemove,
                    0,
                    0,
                    owner.address,
                    deadline
                )
            )
            .to.emit(simpleSwap, 'LiquidityRemoved')
            .withArgs(
                owner.address,
                parseEther("50"),
                parseEther("50"),
                liquidityToRemove
            );
        });
    });

    describe('swapExactTokensForTokens', () => {
        beforeEach(async () => {
            // Add initial liquidity with a larger amount
            const amountA = parseEther("1000"); // Increased initial liquidity
            const amountB = parseEther("1000");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).addLiquidity(
                token0.target,
                token1.target,
                amountA,
                amountB,
                0,
                0,
                owner.address,
                deadline
            );
        });
        

        it('should swap tokens correctly', async () => {
            const amountIn = 10;
            const initialToken0Balance = await token0.balanceOf(owner.address);
            const initialToken1Balance = await token1.balanceOf(owner.address);
            
            // Get reserves from the pool
            const reserveIn = await token0.balanceOf(simpleSwap.target);
            const reserveOut = await token1.balanceOf(simpleSwap.target);
            
            // Calculate expected output
            const expectedOut = await simpleSwap.getAmountOut(amountIn, reserveIn, reserveOut);
            
            // Approve the swap
            await token0.connect(owner).approve(simpleSwap.target, amountIn);
            
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).swapExactTokensForTokens(
                amountIn,
                0,
                [token0.target, token1.target],
                owner.address,
                deadline
            );

            // Check final balances
            const finalToken0Balance = await token0.balanceOf(owner.address);
            const finalToken1Balance = await token1.balanceOf(owner.address);

            // Verify token0 was deducted
            expect(initialToken0Balance - finalToken0Balance).to.equal(amountIn);
            
            // Verify token1 was received (approximately)
            expect(finalToken1Balance - initialToken1Balance).to.be.closeTo(
                expectedOut,
                parseEther("0.001")
            );
        });

        it('should revert if deadline has passed', async () => {
            const amountIn = parseEther("10");
            await token0.connect(owner).approve(simpleSwap.target, amountIn);
            
            const reserveIn = await token0.balanceOf(simpleSwap.target);
            const reserveOut = await token1.balanceOf(simpleSwap.target);
            const expectedOut = await simpleSwap.getAmountOut(amountIn, reserveIn, reserveOut);            
            const expiredDeadline = (await ethers.provider.getBlock('latest')).timestamp - 1;
            
            await expect(
                simpleSwap.connect(owner).swapExactTokensForTokens(
                    amountIn,
                    expectedOut + 1n,
                    [token0.target, token1.target],
                    owner.address,
                    expiredDeadline
                )
            ).to.be.revertedWith("Deadline passed");
        });

        it('should revert if output amount is below minimum', async () => {
            const amountIn = parseEther("10");
            await token0.connect(owner).approve(simpleSwap.target, amountIn);
            
            const reserveIn = await token0.balanceOf(simpleSwap.target);
            const reserveOut = await token1.balanceOf(simpleSwap.target);
            const expectedOut = await simpleSwap.getAmountOut(amountIn, reserveIn, reserveOut);
            
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            
            await expect(
                simpleSwap.connect(owner).swapExactTokensForTokens(
                    amountIn,
                    expectedOut + 1n,
                    [token0.target, token1.target],
                    owner.address,
                    deadline
                )
            ).to.be.revertedWith("Insufficient output amount");
        });

        it('should revert if path is invalid', async () => {
            const amountIn = parseEther("10");
            await token0.connect(owner).approve(simpleSwap.target, amountIn);
            
            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            
            await expect(
                simpleSwap.connect(owner).swapExactTokensForTokens(
                    amountIn,
                    0,
                    [token0.target],
                    owner.address,
                    deadline
                )
            ).to.be.revertedWith("Invalid path");
            
            await expect(
                simpleSwap.connect(owner).swapExactTokensForTokens(
                    amountIn,
                    0,
                    [token0.target, token0.target],
                    owner.address,
                    deadline
                )
            ).to.be.revertedWith("Invalid tokens");
        });
    });

    describe('getPrice', () => {
        beforeEach(async () => {
            // Add initial liquidity with 1:2 ratio
            const amountA = parseEther("100");
            const amountB = parseEther("200");
            
            await token0.connect(owner).approve(simpleSwap.target, amountA);
            await token1.connect(owner).approve(simpleSwap.target, amountB);

            const deadline = (await ethers.provider.getBlock('latest')).timestamp + 100;
            await simpleSwap.connect(owner).addLiquidity(
                token0.target,
                token1.target,
                amountA,
                amountB,
                0,
                0,
                owner.address,
                deadline
            );
        });

        it('should return correct price ratio', async () => {
            const price = await simpleSwap.getPrice(token0.target, token1.target);
            expect(price).to.equal(parseEther("2")); // 200 token1 / 100 token0 = 2
            
            const inversePrice = await simpleSwap.getPrice(token1.target, token0.target);
            expect(inversePrice).to.equal(parseEther("0.5")); // 100 token0 / 200 token1 = 0.5
        });
    });

    describe('getAmountOut', () => {
        it('should calculate output amount correctly', async () => {
            const amountIn = parseEther("10");
            const reserveIn = parseEther("100");
            const reserveOut = parseEther("200");
            
            const amountOut = await simpleSwap.getAmountOut(amountIn, reserveIn, reserveOut);

            // Expected calculation: (amountIn * reserveOut * 10n ** 18n) / (amountIn + reserveIn)
            const expectedNumerator = amountIn * reserveOut * 10n ** 18n;
            const expectedDenominator = amountIn + reserveIn;
            const expectedAmountOut = expectedNumerator / expectedDenominator;
            
            expect(amountOut).to.equal(expectedAmountOut);
        });

        it('should revert if denominator is zero', async () => {
            await expect(
                simpleSwap.getAmountOut(0, 0, parseEther("100"))
            ).to.be.revertedWith("No division");
        });
    });
});

describe('SimpleSwap ERC20 Compliance', () => {
    let SimpleSwap;
    let simpleSwap;
    let Token0, token0;
    let Token1, token1;
    let owner, user1, user2;

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        Token0 = await ethers.getContractFactory("TokenA");
        Token1 = await ethers.getContractFactory("TokenB");
        token0 = await Token0.deploy(owner.address, owner.address);
        token1 = await Token1.deploy(owner.address, owner.address);
        
        SimpleSwap = await ethers.getContractFactory("SimpleSwap");
        simpleSwap = await SimpleSwap.deploy(token0.target, token1.target);

        // Add some liquidity to mint LP tokens
        const amount = parseEther("100");
        await token0.approve(simpleSwap.target, amount);
        await token1.approve(simpleSwap.target, amount);
        await simpleSwap.addLiquidity(
            token0.target,
            token1.target,
            amount,
            amount,
            0,
            0,
            owner.address,
            (await ethers.provider.getBlock('latest')).timestamp + 100
        );
    });

    describe('ERC20 Basic Functionality', () => {
        it('should return correct name and symbol', async () => {
            expect(await simpleSwap.name()).to.equal("Liquidity");
            expect(await simpleSwap.symbol()).to.equal("LIQ");
        });

        it('should return correct decimals', async () => {
            expect(await simpleSwap.decimals()).to.equal(18);
        });

        it('should return total supply', async () => {
            const totalSupply = await simpleSwap.totalSupply();
            expect(totalSupply).to.equal(parseEther("100")); // sqrt(100*100) = 100
        });

        it('should return balance of account', async () => {
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(parseEther("100"));
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(0);
        });
    });

    describe('ERC20 Transfer Functionality', () => {
        it('should transfer tokens between accounts', async () => {
            const transferAmount = parseEther("50");
            
            await simpleSwap.transfer(user1.address, transferAmount);
            
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(parseEther("50"));
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(transferAmount);
        });

        it('should emit Transfer event on transfer', async () => {
            const transferAmount = parseEther("10");
            
            await expect(simpleSwap.transfer(user1.address, transferAmount))
                .to.emit(simpleSwap, 'Transfer')
                .withArgs(owner.address, user1.address, transferAmount);
        });

        it('should not change balances on failed transfer', async () => {
            const initialOwnerBalance = await simpleSwap.balanceOf(owner.address);
            const initialUserBalance = await simpleSwap.balanceOf(user1.address);
            
            await expect(
                simpleSwap.transfer(user1.address, initialOwnerBalance + 1n)
            ).to.be.reverted;

            expect(await simpleSwap.balanceOf(owner.address)).to.equal(initialOwnerBalance);
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(initialUserBalance);
        });
    });

    describe('ERC20 Allowance Functionality', () => {
        it('should approve and return allowance', async () => {
            const approveAmount = parseEther("30");
            
            await simpleSwap.approve(user1.address, approveAmount);
            
            expect(await simpleSwap.allowance(owner.address, user1.address)).to.equal(approveAmount);
        });

        it('should emit Approval event on approve', async () => {
            const approveAmount = parseEther("15");
            
            await expect(simpleSwap.approve(user1.address, approveAmount))
                .to.emit(simpleSwap, 'Approval')
                .withArgs(owner.address, user1.address, approveAmount);
        });

        it('should transferFrom with allowance', async () => {
            const approveAmount = parseEther("25");
            const transferAmount = parseEther("20");
            
            await simpleSwap.approve(user1.address, approveAmount);
            await simpleSwap.connect(user1).transferFrom(
                owner.address, 
                user2.address, 
                transferAmount
            );
            
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(parseEther("80"));
            expect(await simpleSwap.balanceOf(user2.address)).to.equal(transferAmount);
            expect(await simpleSwap.allowance(owner.address, user1.address)).to.equal(parseEther("5"));
        });
    });

    describe('ERC20 Edge Cases', () => {
        it('should handle zero amount transfers', async () => {
            await expect(simpleSwap.transfer(user1.address, 0))
                .to.emit(simpleSwap, 'Transfer')
                .withArgs(owner.address, user1.address, 0);
            
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(parseEther("100"));
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(0);
        });

        it('should handle zero amount approvals', async () => {
            await expect(simpleSwap.approve(user1.address, 0))
                .to.emit(simpleSwap, 'Approval')
                .withArgs(owner.address, user1.address, 0);
            
            expect(await simpleSwap.allowance(owner.address, user1.address)).to.equal(0);
        });

        it('should handle self transfers', async () => {
            const balance = await simpleSwap.balanceOf(owner.address);
            
            await expect(simpleSwap.transfer(owner.address, balance))
                .to.emit(simpleSwap, 'Transfer')
                .withArgs(owner.address, owner.address, balance);
            
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(balance);
        });

        it('should handle maximum uint256 values', async () => {
            const maxUint = ethers.MaxUint256;
            
            // Approve max
            await simpleSwap.approve(user1.address, maxUint);
            expect(await simpleSwap.allowance(owner.address, user1.address)).to.equal(maxUint);
            
            // Transfer max (requires minting more tokens first)
            await token0.approve(simpleSwap.target, parseEther("1000"));
            await token1.approve(simpleSwap.target, parseEther("1000"));
            await simpleSwap.addLiquidity(
                token0.target,
                token1.target,
                parseEther("1000"),
                parseEther("1000"),
                0,
                0,
                owner.address,
                (await ethers.provider.getBlock('latest')).timestamp + 100
            );
            
            const newBalance = await simpleSwap.balanceOf(owner.address);
            await simpleSwap.transfer(user1.address, newBalance);
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(newBalance);
        });
    });

    describe('ERC20 Integration with Liquidity Functions', () => {
        it('should mint LP tokens when adding liquidity', async () => {
            const initialSupply = await simpleSwap.totalSupply();
            const amount = parseEther("50");
            
            await token0.approve(simpleSwap.target, amount);
            await token1.approve(simpleSwap.target, amount);
            
            await simpleSwap.addLiquidity(
                token0.target,
                token1.target,
                amount,
                amount,
                0,
                0,
                owner.address,
                (await ethers.provider.getBlock('latest')).timestamp + 100
            );
            
            const newSupply = await simpleSwap.totalSupply();
            expect(newSupply).to.be.gt(initialSupply);
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(newSupply);
        });

        it('should burn LP tokens when removing liquidity', async () => {
            const initialSupply = await simpleSwap.totalSupply();
            const balance = await simpleSwap.balanceOf(owner.address);
            
            await simpleSwap.removeLiquidity(
                token0.target,
                token1.target,
                balance,
                0,
                0,
                owner.address,
                (await ethers.provider.getBlock('latest')).timestamp + 100
            );
            
            const newSupply = await simpleSwap.totalSupply();
            expect(newSupply).to.be.lt(initialSupply);
            expect(await simpleSwap.balanceOf(owner.address)).to.equal(0);
        });

        it('should allow transfer of LP tokens independently', async () => {
            const amount = parseEther("30");
            await simpleSwap.transfer(user1.address, amount);
            
            // User1 should now be able to remove liquidity
            await simpleSwap.connect(user1).removeLiquidity(
                token0.target,
                token1.target,
                amount,
                0,
                0,
                user1.address,
                (await ethers.provider.getBlock('latest')).timestamp + 100
            );
            
            expect(await simpleSwap.balanceOf(user1.address)).to.equal(0);
        });
    });
});