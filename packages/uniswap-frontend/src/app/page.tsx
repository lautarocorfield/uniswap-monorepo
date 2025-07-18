'use client'
import { useState } from "react";
import { Dialog, Button, Card, Input, Stack, Box, Heading, SimpleGrid, Text, Flex, List, Center, Spinner, useDisclosure, Portal, NativeSelect, Alert } from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { LuCircleCheck } from "react-icons/lu";
import { BigNumber, ethers } from "ethers";

type Token = {
  symbol: string,
  address: string,
  abi: string
}
type ERC20Name = "toka" | "tokb";

type ERC20List = Record<ERC20Name, Token>

export default function Home() {
  const contractAddress = "0x3C3077FE6058bADd6d61cBaF412Ad953AF74D2aF";
  const abiContract = `[{"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"provider","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountA","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountB","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"liquidity","type":"uint256"}],"name":"LiquidityAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"provider","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountA","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountB","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"liquidity","type":"uint256"}],"name":"LiquidityRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"price","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]`;  
  
  const toka: Token = {
    symbol: "TOKA",
    address: "0x6B5900a635970E90b6Fd87b31e44ADc1C9C700b0",
    abi: `[{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
  }

  const tokb: Token = {
    symbol: "TOKB",
    address: "0xFced11AECDC305aebb442d1b44dfF732724F1A92",
    abi: `[{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
  }

  const tokens: ERC20List = {
    'toka' : toka,
    'tokb' : tokb,
  };

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [amountToSwap, setAmountToSwap] = useState<string>();
  const [operationResults, setOperationResults] = useState<string[]>();
  const [selectedToken, setSelectedToken] = useState<ERC20Name>('toka');
  const [amountOutMin, setAmountOutMin] = useState<BigNumber>();
  const [symbolToReceive, setSymbolToReceive] = useState<string>();
  const swapModal = useDisclosure();
  const priceModal = useDisclosure();

  const connectWallet = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      toaster.create({
        title: "MetaMask no detectado",
        description: "Por favor, instala MetaMask para conectarte.",
        duration: 5000,
        type: 'error',
      });
      return;
    }

    if (isConnected) {
      toaster.create({
        title: "Ya estás conectado",
        description: `Wallet conectada como ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}`,
        duration: 3000,
        type: 'info',
      });
      return;
    }

    try {
      setIsLoading(true);

      const provider = new ethers.providers.Web3Provider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || accounts.length === 0) {
        throw new Error("Por favor, autoriza el acceso a tu wallet.");
      }

      const signer = provider.getSigner();
      const address = accounts[0];

      const network = await provider.getNetwork();
      const expectedChainId = 11155111;
      if (network.chainId !== expectedChainId) {
        throw new Error(`Por favor, cambia a la red correcta (ChainID: ${expectedChainId})`);
      }

      setSigner(signer);
      setUserAddress(address);
      setContract(new ethers.Contract(contractAddress, abiContract, signer));
      setIsConnected(true);

      toaster.create({
        title: "Wallet conectada",
        description: `Conectado como ${address.slice(0, 6)}...${address.slice(-4)}`,
        duration: 5000,
        type: 'success',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      let errorMessage = "Hubo un error al conectar la wallet.";
      console.log("error", error);

      if (error.code === 4001) {
        errorMessage = "Rechazaste la conexión con MetaMask.";
      }else if (error.message.includes("authorize") || error.code === -32002) {
        errorMessage = "Por favor, autoriza el acceso a tu wallet.";
      } else if (error.message.includes("network")) {
        errorMessage = "Red incorrecta. Conectate a la red solicitada.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      toaster.create({
        title: "Error",
        description: errorMessage,
        duration: 5000,
        type: 'error',
      });

    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrice = async (firstTokenAddress: string, secondTokenAddress: string) => {
    try {
      priceModal.onClose();
      setIsLoading(true);
      const mainToken = firstTokenAddress == tokens['toka'].address ? 'TOKA' : 'TOKB';
      const priceWei = await contract?.getPrice(firstTokenAddress, secondTokenAddress);
      console.log("priceWei", ethers.utils.formatEther(priceWei));
      const priceResult = `El precio de ${mainToken} es ${parseFloat(ethers.utils.formatEther(priceWei)).toFixed(4)}`
      setOperationResults((prevResults) => [
        ...(prevResults || []),
        priceResult,
      ]);
      toaster.create({ title: "Precio", description: priceResult, type: "success" });
    } catch (error) {
      console.log("error", error);
      toaster.create({ title: "Error", description: "Hubo un error, no se pudo obtener el precio", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTokenAmount = (weiAmount: BigNumber, decimals: number) => {
    const amount = ethers.utils.formatUnits(weiAmount, decimals);
    return parseFloat(amount).toLocaleString('fullwide', { 
      maximumFractionDigits: 4,
      useGrouping: false
    });
  };

  const swap = async () => {
    if(!signer) return;
    if(!contract) return;
    if (!amountToSwap || isNaN(Number(amountToSwap))) {
      toaster.create({ title: "Error", description: "Ingresa una cantidad válida", type: "error" });
      return;
    }
    try {
      setIsLoading(true);
      const tokenIn = tokens[selectedToken];
      const tokenOutName = Object.keys(tokens).find((t) => t !== selectedToken) as ERC20Name;
      const tokenOut = tokens[tokenOutName];

      const tokenInContract = new ethers.Contract(tokenIn.address, tokenIn.abi, signer);
      const tokenOutContract = new ethers.Contract(tokenOut.address, tokenOut.abi, signer);

      const reserveIn = await tokenInContract.balanceOf(contract.address);
      const reserveOut = await tokenOutContract.balanceOf(contract.address);

      if (reserveIn.isZero() || reserveOut.isZero()) {
        throw new Error("No hay suficiente liquidez en el pool");
      }

      const amountOutWei = await contract.getAmountOut(amountToSwap.toString(), reserveIn, reserveOut);

      const amountOutMinWei = amountOutWei.mul(995).div(1000);

      setAmountOutMin(amountOutMinWei);
      setSymbolToReceive(tokenOutName);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error en swap:", {
        error,
        message: error.message,
        data: error.data
      });

      let errorMsg = "Error al ejecutar el swap";
      if (error.message.includes("reserve")) {
        errorMsg = "Liquidez insuficiente en el pool";
      }

      toaster.create({
        title: "Error en el swap",
        description: errorMsg,
        type: "error",
        duration: 8000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSwap = async () => {
    if(!signer || !contract || !amountOutMin || !amountToSwap) return;
    try {
      setIsLoading(true);
      setSwapLoading(true);
      const tokenIn = tokens[selectedToken];
      const tokenOutName = Object.keys(tokens).find((t) => t !== selectedToken) as ERC20Name;
      const tokenOut = tokens[tokenOutName];

      const tokenInContract = new ethers.Contract(tokenIn.address, tokenIn.abi, signer);
      const tokenOutContract = new ethers.Contract(tokenOut.address, tokenOut.abi, signer);

      const decimalsOut = await tokenOutContract.decimals();
      const decimalsIn = await tokenInContract.decimals();
      
      const amountInWei = ethers.utils.parseUnits(amountToSwap.toString(), decimalsIn);

      const allowance = await tokenInContract.allowance(userAddress, contract.address);
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenInContract.approve(contract.address, amountInWei);
        await approveTx.wait();
      }

      const tx = await contract.swapExactTokensForTokens(
        amountToSwap,
        amountOutMin,
        [tokenIn.address, tokenOut.address],
        userAddress,
        Math.floor(Date.now() / 1000) + 600, // 10 minutos
      );

      await tx.wait();

      const message = `Intercambiaste ${amountToSwap} ${tokenIn.symbol} por ${formatTokenAmount(amountOutMin, decimalsOut)} ${tokenOut.symbol}`;
      toaster.create({
        title: "Swap exitoso",
        description: message,
        type: "success",
        duration: 8000
      });

      setOperationResults((prevResults) => [
        ...(prevResults || []),
        message,
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error en swap:", {
        error,
        message: error.message,
        data: error.data
      });

      let errorMsg = "Error al ejecutar el swap";
      if (error.code === "INSUFFICIENT_OUTPUT_AMOUNT") {
        errorMsg = "Precio cambiado. Intenta con más slippage (2-5%)";
      } else if (error.message.includes("TRANSFER_FROM_FAILED")) {
        errorMsg = "Falta aprobación de tokens. Intenta nuevamente.";
      } else if (error.message.includes("reserve")) {
        errorMsg = "Liquidez insuficiente en el pool";
      }

      toaster.create({
        title: "Error en el swap",
        description: errorMsg,
        type: "error",
        duration: 8000
      });
    } finally {
      setIsLoading(false);
      setSwapLoading(false);
      closeSwapModal();
    }
  }

  const closeSwapModal = () => {
    swapModal.onClose();
    setAmountOutMin(undefined);
    setAmountToSwap(undefined);
    setSymbolToReceive(undefined);
  }

  const mintTokens = async () => {
    if(!signer) return;
    try{
      setIsLoading(true);
      const tokenA = new ethers.Contract(tokens['toka'].address, tokens['toka'].abi, signer);
      const tokenB = new ethers.Contract(tokens['tokb'].address, tokens['tokb'].abi, signer);

      const mintAmountEther = 1000;
      const mintAmountWei = ethers.utils.parseEther(mintAmountEther.toString());

      const txA = await tokenA.mint(userAddress, mintAmountWei);
      await txA.wait();

      const txB = await tokenB.mint(userAddress, mintAmountWei);
      await txB.wait()

      const mintResult = `Se generaron ${mintAmountEther} de cada token con tu dirección`;
      setOperationResults((prevResults) => [
        ...(prevResults || []),
        mintResult,
      ]);

      toaster.create({
        title: "Tokens minteados con éxito",
        description: (
          <Box>
            <Text>Se mintearon {mintAmountEther} de ambos tokens</Text>
            <Text fontSize="sm">TokenA TX: {txA.hash}</Text>
            <Text fontSize="sm">TokenB TX: {txB.hash}</Text>
          </Box>
        ),
        type: "success",
        duration: 9000,
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch(error: any){
      console.error("error", error);
      toaster.create({
        title: "Error al mintear",
        description: "Hubo un error, intente mas tarde",
        type: "error",
        duration: 5000
      })

    }finally{
      setIsLoading(false);
    }
  }

  return (
    <Box p={4} maxW="1200px" mx="auto">
      {!isConnected ? (
        <Card.Root textAlign="center" p={8} mt={20}>
          <Heading size="lg" mb={4}>Conectá tu Wallet</Heading>
          <Button 
            colorPalette="gray" 
            size="lg" 
            onClick={connectWallet}
          >
            Conectar Wallet
          </Button>
        </Card.Root>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} columnGap={2}>
          {/* Panel de Operaciones */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Operaciones disponibles</Heading>
              <Flex align="center">
                <Box 
                  width="10px" 
                  height="10px" 
                  borderRadius="50%" 
                  bg="green.500" 
                  marginRight="8px" 
                />
                <Text>Conectado {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}</Text>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Stack>
                <Button 
                  colorPalette="gray" 
                  onClick={priceModal.onOpen}
                >
                  Obtener Precio
                </Button>

                <Button 
                  colorPalette="gray" 
                  onClick={mintTokens}
                >
                  Obtener Tokens
                </Button>

                <Button 
                  colorPalette="gray" 
                  onClick={swapModal.onOpen}
                >
                  Intercambiar Tokens
                </Button>

                {/* Obtener precio - Modal */}
                <Dialog.Root open={priceModal.open} onOpenChange={priceModal.onToggle}>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content>
                        <Dialog.Header>
                          <Dialog.Title>Obtener precio</Dialog.Title>
                          <Dialog.CloseTrigger />
                        </Dialog.Header>
                        <Dialog.Body>
                          <Flex justify="center" mt={6} gap={4}>
                            <Button
                              colorPalette="green"
                              onClick={() => fetchPrice(tokens['toka'].address, tokens['tokb'].address)}
                            >
                              Token A (TOKA) / TOKB
                            </Button>

                            <Button
                              colorPalette="teal"
                              onClick={() => fetchPrice(tokens['tokb'].address, tokens['toka'].address)}
                            >
                              Token B (TOKB) / TOKA
                            </Button>
                          </Flex>
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Button variant="outline" onClick={priceModal.onClose}>Cerrar</Button>
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>

                {/* Intercambiar - Modal */}
                <Dialog.Root open={swapModal.open} onOpenChange={swapModal.onToggle} onExitComplete={closeSwapModal}>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content>
                        <Dialog.Header>
                          <Dialog.Title>Intercambiar tokens</Dialog.Title>
                          <Dialog.CloseTrigger />
                        </Dialog.Header>
                        <Dialog.Body>
                          <Text fontWeight="medium" mb={2}>
                            Seleccionar token
                          </Text>
                          <NativeSelect.Root size="md" width="240px" disabled={amountOutMin !== undefined}>
                            <NativeSelect.Field
                              placeholder="Seleccionar token"
                              value={selectedToken}
                              onChange={(e) => setSelectedToken((e.currentTarget.value as ERC20Name))}
                              
                            >
                              <option value="toka">TOKA</option>
                              <option value="tokb">TOKB</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          <Box mb={5}>
                            <Text fontWeight="medium" mb={2}>
                              Cantidad
                            </Text>
                            <Input 
                              disabled={amountOutMin !== undefined}
                              placeholder="100" 
                              value={amountToSwap}
                              onChange={(e) => {
                                if (/^\d*\.?\d*$/.test(e.target.value)) {
                                  setAmountToSwap(e.target.value)
                                }
                              }}
                            />
                          </Box>
                          {(amountOutMin) && 
                            <>
                              <Alert.Root status="info">
                                <Alert.Indicator />
                                <Alert.Title>
                                  Vas a recibir {formatTokenAmount(amountOutMin, 18)} de {symbolToReceive?.toUpperCase()}
                                </Alert.Title>
                              </Alert.Root>
                            </>
                          }
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Button variant="outline" onClick={closeSwapModal} disabled={swapLoading}>Cerrar</Button>
                          {(amountOutMin) ? 
                            <Button onClick={confirmSwap} disabled={!amountToSwap} loading={swapLoading} loadingText='Intercambiando...'>Confirmar</Button>
                          : 
                            <Button onClick={swap} disabled={!amountToSwap || !selectedToken}>Intercambiar</Button>
                          }
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Panel de Resultados */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Resultados</Heading>
            </Card.Header>
            <Card.Body display="flex">
              <Box flex="1" maxHeight="95%" overflowY="auto" maxWidth="110%">
                <List.Root gap="2" variant="plain" align="center">
                  {(operationResults && operationResults?.length > 0) 
                    ? operationResults?.map((result: string, index: number) => (
                        <List.Item key={index}>
                          <List.Indicator asChild color="green.500">
                            <LuCircleCheck />
                          </List.Indicator>
                          {result}
                        </List.Item>                
                      ))
                  : 
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text>Las transacciones aparecerán acá</Text>
                  </Box>
                  }
                </List.Root>

              </Box>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      )}

      {(isLoading) && 
        <Box pos="absolute" inset="0" bg="bg/80">
          <Center h="full">
            <Spinner color="teal.500" />
          </Center>
        </Box>
      }
      <Toaster />
    </Box>
  );
}