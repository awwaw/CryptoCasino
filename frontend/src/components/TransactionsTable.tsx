import { useEffect, useState } from 'react';
import './TransactionsTable.css';

interface Transaction {
    id: number;
    playerAddress: string;
    transactionType: string;
    amount: number;
    winAmount?: number;
    slotResult?: string;
    txHash?: string;
    timestamp: string;
}

interface PageResponse {
    content: Transaction[];
    totalPages: number;
    totalElements: number;
    number: number;
}

const API_URL = "http://localhost:8080/api/transactions";
export function TransactionsTable() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (pageNumber: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}?page=${pageNumber}&size=10`);
            if (response.ok) {
                const data: PageResponse = await response.json();
                console.log("API response: ", data);
                setTransactions(data.content);
                setTotalPages(data.totalPages);
                setPage(data.number);
            }
        } catch (error) {
            console.error(error);
            setError("Couldn't load transactions history");
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData(page);
    }, [page]);

    useEffect(() => {
        if (page === 0) {
            const interval = setInterval(() => fetchData(0), 5000);
            return () => clearInterval(interval);
        }
    })

return (
        <div className="table-container">
            <h3>📜 Transactions history (Page {page + 1} out of {totalPages})</h3>
            
            {error && <p style={{color: 'red'}}>{error}</p>}

            {loading && transactions.length === 0 ? (
                <p>Loading...</p>
            ) : (
                <>
                    <table className="tx-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Player</th>
                                <th>Type</th>
                                <th>Result</th>
                                <th>Win</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} className={tx.winAmount && tx.winAmount > 0 ? "win-row" : ""}>
                                    <td>
                                        {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : "-"}
                                    </td>
                                    
                                    <td title={tx.playerAddress}>
                                        {tx.playerAddress 
                                            ? `${tx.playerAddress.substring(0, 6)}... `
                                            : "Unknown"}
                                    </td>
                                    
                                    <td>
                                        <span className={`badge badge-${tx.transactionType ? tx.transactionType.toLowerCase() : 'unknown'}`}>
                                            {tx.transactionType}
                                        </span>
                                    </td>

                                    <td>{tx.slotResult || "-"}</td>
                                    
                                    <td className={tx.winAmount && tx.winAmount > 0 ? "text-green" : ""}>
                                        {tx.winAmount ? Number(tx.winAmount).toFixed(4) : "0.0"}
                                    </td>
                                    
                                    <td>
                                        {tx.txHash && (
                                            <a 
                                                href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="link-icon"
                                            >
                                                🔗
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            
                            {transactions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} style={{textAlign: 'center', padding: '20px'}}>
                                        No data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="pagination-controls">
                        <button 
                            onClick={() => setPage(p => Math.max(0, p - 1))} 
                            disabled={page === 0 || loading}
                            className="btn-page"
                        >
                            &laquo; Prev
                        </button>
                        
                        <span className="page-info">
                            {page + 1} / {totalPages || 1}
                        </span>
                        
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                            disabled={page >= totalPages - 1 || loading}
                            className="btn-page"
                        >
                            Next &raquo;
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

