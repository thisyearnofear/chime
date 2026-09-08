import { useState, useEffect, useCallback } from 'react'
import { createWalletClient, createPublicClient, custom, http, type Address, type WalletClient } from 'viem'
import { useAddToast } from '@/components/unified/UnifiedToast'
import { getNetworkConfig, getMarketNetwork } from '@/lib/markets/config'
import { defineChain } from 'viem'

const activeNetwork = getNetworkConfig()
const marketNet = getMarketNetwork()

export const somniaChain = defineChain({
  id: marketNet.chainId,
  name: marketNet.name,
  nativeCurrency: marketNet.nativeCurrency,
  rpcUrls: {
    default: { http: [marketNet.rpcUrl], webSocket: [marketNet.wsRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: marketNet.blockExplorer },
  },
})

const SOMNIA_NETWORK_PARAMS_FOR_WALLET = {
  chainId: `0x${activeNetwork.chainId.toString(16)}`,
  chainName: activeNetwork.name,
  nativeCurrency: activeNetwork.nativeCurrency,
  rpcUrls: [activeNetwork.rpcUrl],
  blockExplorerUrls: [activeNetwork.blockExplorer],
}

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number | null
  balance: string | null
  networkMetrics: {
    lastTxSpeed: number | null
    isOnSomnia: boolean
  }
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchToSomnia: () => Promise<boolean>
  trackTransactionSpeed: (txHash: string) => Promise<void>
  getWalletClient: () => WalletClient | null
}

export function useWallet(): UseWalletReturn {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
    networkMetrics: {
      lastTxSpeed: null,
      isOnSomnia: false,
    },
  })

  const addToast = useAddToast()
  const provider = typeof window !== 'undefined' ? window.ethereum : undefined
  const isInstalled = !!provider

  const isMetaMaskInstalled = useCallback(() => isInstalled && !!provider, [isInstalled, provider])

  const getWalletClient = useCallback((): WalletClient | null => {
    if (!provider || !walletState.address) return null
    return createWalletClient({
      account: walletState.address as Address,
      chain: somniaChain,
      transport: custom(provider),
    })
  }, [provider, walletState.address])

  const updateWalletState = useCallback(async () => {
    if (!isMetaMaskInstalled() || !provider) return

    try {
      const timeout = (ms: number) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Provider request timeout')), ms))

      const accounts = (await Promise.race([
        provider.request({ method: 'eth_accounts' }),
        timeout(5000),
      ])) as string[]

      const chainId = (await Promise.race([
        provider.request({ method: 'eth_chainId' }),
        timeout(5000),
      ])) as string

      if (accounts.length > 0) {
        const balance = (await Promise.race([
          provider.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          }),
          timeout(5000),
        ])) as string

        setWalletState((prev) => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
          chainId: parseInt(chainId, 16),
          balance: (parseInt(balance, 16) / 1e18).toFixed(4),
          networkMetrics: {
            ...prev.networkMetrics,
            isOnSomnia: parseInt(chainId, 16) === activeNetwork.chainId,
          },
        }))
      } else {
        setWalletState((prev) => ({
          ...prev,
          address: null,
          isConnected: false,
          isConnecting: false,
          balance: null,
        }))
      }
    } catch (error) {
      console.warn('Wallet provider timeout or error:', error)
      setWalletState((prev) => ({ ...prev, isConnecting: false }))
    }
  }, [isMetaMaskInstalled, provider])

  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      addToast({
        type: 'error',
        message: 'MetaMask is not installed. Please install MetaMask to continue.',
      })
      return
    }

    setWalletState((prev) => ({ ...prev, isConnecting: true }))

    try {
      if (!provider) throw new Error('MetaMask not available')

      await provider.request({ method: 'eth_requestAccounts' })
      await updateWalletState()

      const currentChainId = (await provider.request({ method: 'eth_chainId' })) as string
      const isOnSomnia = parseInt(currentChainId, 16) === activeNetwork.chainId

      if (!isOnSomnia) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK_PARAMS_FOR_WALLET],
          })
          addToast({ type: 'success', message: 'Somnia Network added to MetaMask.' })
        } catch {
          console.log('User declined adding Somnia network')
        }
      }

      addToast({ type: 'success', message: 'Wallet connected.' })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet'
      addToast({ type: 'error', message })
      setWalletState((prev) => ({ ...prev, isConnecting: false }))
    }
  }, [isMetaMaskInstalled, updateWalletState, addToast, provider])

  const disconnect = useCallback(() => {
    setWalletState((prev) => ({
      ...prev,
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      balance: null,
    }))
    addToast({ type: 'info', message: 'Wallet disconnected' })
  }, [addToast])

  const switchToSomnia = useCallback(async () => {
    if (!provider) {
      addToast({ message: 'MetaMask not detected.', type: 'error' })
      return false
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_NETWORK_PARAMS_FOR_WALLET.chainId }],
      })
      addToast({ message: 'Switched to Somnia.', type: 'success' })
      await updateWalletState()
      return true
    } catch (switchError: unknown) {
      const code = (switchError as { code?: number }).code
      if (code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK_PARAMS_FOR_WALLET],
          })
          addToast({ message: 'Somnia Network added.', type: 'success' })
          await updateWalletState()
          return true
        } catch {
          addToast({ message: 'Failed to add Somnia Network.', type: 'error' })
          return false
        }
      }
      addToast({ message: 'Failed to switch to Somnia.', type: 'error' })
      return false
    }
  }, [addToast, provider, updateWalletState])

  useEffect(() => {
    if (!isMetaMaskInstalled() || !provider) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) disconnect()
      else void updateWalletState()
    }

    const handleChainChanged = () => {
      void updateWalletState()
    }

    provider.on('accountsChanged', handleAccountsChanged)
    provider.on('chainChanged', handleChainChanged)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void updateWalletState()

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged)
      provider.removeListener('chainChanged', handleChainChanged)
    }
  }, [isMetaMaskInstalled, updateWalletState, disconnect, provider])

  const trackTransactionSpeed = useCallback(
    async (txHash: string) => {
      if (!provider) return
      const startTime = Date.now()
      try {
        const publicClient = createPublicClient({
          chain: somniaChain,
          transport: http(marketNet.rpcUrl),
        })
        await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
        const speed = (Date.now() - startTime) / 1000
        setWalletState((prev) => ({
          ...prev,
          networkMetrics: { ...prev.networkMetrics, lastTxSpeed: speed },
        }))
        addToast({ type: 'success', message: `Confirmed in ${speed.toFixed(1)}s on Somnia.` })
      } catch (error) {
        console.error('Transaction tracking failed:', error)
      }
    },
    [addToast, provider]
  )

  return {
    ...walletState,
    connect,
    disconnect,
    switchToSomnia,
    trackTransactionSpeed,
    getWalletClient,
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (...args: never[]) => void) => void
      removeListener: (event: string, callback: (...args: never[]) => void) => void
    }
  }
}
