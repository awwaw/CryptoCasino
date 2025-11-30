import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './contracts/SlotMachineABI.json'; 
import './App.css';

const CONTRACT_ADDRESS = "0xe12D1f41756FD1Dc0e06993976F7c63FB36DAEa8";

const ICONS = ['🍒', '🍋', '🍇', '🍉', '💎', '7️⃣'];

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [account, setAccount] = useState<string | null>(null); // playerAddress
  const [balance, setBalance] = useState<string>("0"); // player balance
  const [slots, setSlots] = useState<number[]>([0, 0, 0]); // images idx
  const [isSpinning, setIsSpinning] = useState(false); // isSpinning
  const [status, setStatus] = useState("Connect wallet to play.");
  const [betAmount, setBetAmount] = useState<string>("0.001");
  const [maxBet, setMaxBet] = useState<string>("0");

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const fetchMaxBet = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(CONTRACT_ADDRESS);
      const maxBet = balanceWei / 10n;
      setMaxBet(ethers.formatEther(maxBet));
    } catch (e) {
      console.error("Couldn't fetch max bet from casino", e);
    }
  }

  useEffect(() => {
    fetchMaxBet();
    const intervalId = setInterval(() => {
      fetchMaxBet();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const checkIfWalletIsConnected = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        // Если есть аккаунт - подключаем
        const address = await accounts[0].getAddress();
        setAccount(address);
        updateBalance(address, provider);
        setStatus("");
      }
    }
  };

  const updateBalance = async (address: string, provider: ethers.BrowserProvider) => {
    const bal = await provider.getBalance(address);
    setBalance(ethers.formatEther(bal));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Пожалуйста, установите Metamask!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setAccount(address);
      updateBalance(address, provider);
      setStatus("Ready to play! Bet: 0.001 ETH");
    } catch (err) {
      console.error(err);
      setStatus("Connection failed.");
    }
  };

  const spin = async () => {
    if (!account || !window.ethereum) return;

    let intervalId: any = null;

    try {
      if (!betAmount || parseFloat(betAmount) <= 0) {
        setStatus("Enter valid bet!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
      const bal = await provider.getBalance(CONTRACT_ADDRESS);
      const required = ethers.parseEther(betAmount) * 10n;
      if (bal < required) {
          const maxCheck = ethers.formatEther(bal / 10n);
          alert(`Casino low on funds: current max bet is: ${maxCheck}`);
          return; 
      }

      setIsSpinning(true);
      setStatus("Sign transaction using Metamask...");

      intervalId = setInterval(() => {
        setSlots([
           Math.floor(Math.random() * 6),
           Math.floor(Math.random() * 6),
           Math.floor(Math.random() * 6)
        ]);
      }, 100);

      const tx = await contract.spin({ value: ethers.parseEther(betAmount) });
      
      setStatus("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      
      if (intervalId) clearInterval(intervalId);
      setIsSpinning(false);

      let found = false;
      let wonAmount = 0;
      for (const log of receipt.logs) {
         try {
             const parsed = contract.interface.parseLog(log);
             if (parsed && parsed.name === 'SpinResult') {
                 const r1 = Number(parsed.args[1]);
                 const r2 = Number(parsed.args[2]);
                 const r3 = Number(parsed.args[3]);
                 const prize = ethers.formatEther(parsed.args[4]);
                 setSlots([r1, r2, r3]);
                 wonAmount = Number(prize);
                 found = true;
             }
         } catch(e) {}
      }

      updateBalance(account, provider);
      fetchMaxBet();

      if (found) {
        if (wonAmount > 0) setStatus(`You won: ${wonAmount} ETH!`);
        else setStatus("Анлак галочка✅");
      }

    } catch (error: any) {
      console.error(error);

      if (intervalId) clearInterval(intervalId);
      setIsSpinning(false);

      if (error.code === 'ACTION_REJECTED') {
          setStatus("Rejected by user");
      } else if (error.reason) {
          setStatus("Contract error: " + error.reason);
      } else if (error.message && error.message.includes("Casino low on funds")) {
          setStatus("Error: Casino low on funds");
      } else {
          setStatus("Unexpected error");
      }
    }
  };


  return (
    <div className="app-container">
      <header>
        <h1>🎰 Sepolia Casino</h1>
        {!account && <p className="subtitle">Connect your wallet to start</p>}
      </header>

      <div className="machine-container">
        <div className="slots-display">
           <div className="reel">{ICONS[slots[0]]}</div>
           <div className="reel">{ICONS[slots[1]]}</div>
           <div className="reel">{ICONS[slots[2]]}</div>
        </div>

        <div className="controls">
          {!account ? (
             <button className="btn-connect" onClick={connectWallet}>
                Connect Metamask
             </button>
          ) : (
             <>
               <div className="info-panel">
                  <div className="info-item">
                    <span className="label">Wallet:</span>
                    <span className="value">{account.slice(0,6)}...{account.slice(-4)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Your balance:</span>
                    <span className="value">{parseFloat(balance).toFixed(4)} ETH</span>
                  </div>
               </div>

               <div className="bet-controls">
                  <div className="bet-info">
                      <label>Bet (ETH):</label>
                      <span className="max-safe">
                          Max bet: {parseFloat(maxBet).toFixed(4)}
                      </span>
                  </div>

                  <div className="bet-input-group">
                      <input 
                        type="number" 
                        step="0.0001"
                        min="0.00001"
                        max={maxBet}
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="bet-input"
                        placeholder="0.001"
                      />
                      
                      <button 
                        className="btn-max"
                        onClick={() => setBetAmount(maxBet)}
                        title="Make your bet equal to max bet"
                      >
                        MAX
                      </button>
                  </div>
               </div>

               <button 
                 className="btn-spin" 
                 onClick={spin} 
                 disabled={isSpinning}
               >
                 {isSpinning ? "SPINNING..." : "SPIN"}
               </button>
             </>
          )}
        </div>
        
        <p className="status-text">{status}</p>
      </div>
      
      <footer>
        <p>Smart Contract: <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">Etherscan</a></p>
      </footer>
    </div>
  );

}

export default App;
