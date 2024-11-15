import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PRACTICE_ZONE_ROUTES } from '@/lib/constants';
import apiClient from '@/lib/api-client';
import { Search, Loader2, Home, Users, BarChart2, BookOpen, Settings } from 'lucide-react';

const PracticeZone = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockInput, setStockInput] = useState({ 
    code: '', 
    quantity: '', 
    price: '' 
  });
  const [currentPrice, setCurrentPrice] = useState(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);

  // Alpha Vantage API key - should be in environment variables
  const ALPHA_VANTAGE_API_KEY = 'U9G25PBTHF1CY2LG';

  const handleNavigation = (path) => {
    if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    initializeAndFetchPortfolio();
  }, []);

  const fetchStockPrice = async (symbol) => {
    if (!symbol) return;
    
    setFetchingPrice(true);
    setPriceError(null);
    
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data['Global Quote']) {
        const price = parseFloat(data['Global Quote']['05. price']);
        setCurrentPrice(price);
        setStockInput(prev => ({ ...prev, price: price.toFixed(2) }));
      } else if (data.Note) {
        setPriceError('API call frequency exceeded. Please try again later.');
      } else {
        setPriceError('Stock symbol not found.');
      }
    } catch (err) {
      setPriceError('Failed to fetch stock price. Please try again.');
      console.error('Stock price fetch error:', err);
    } finally {
      setFetchingPrice(false);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedFetchPrice = debounce(fetchStockPrice, 1000);

  const handleCodeChange = (e) => {
    const newCode = e.target.value.toUpperCase();
    setStockInput(prev => ({ ...prev, code: newCode }));
    if (newCode.length >= 1) {
      debouncedFetchPrice(newCode);
    }
  };

  const initializeAndFetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.get(PRACTICE_ZONE_ROUTES.INITIALIZE, {
        withCredentials: true,
      });
      
      const response = await apiClient.get(PRACTICE_ZONE_ROUTES.GET_PORTFOLIO, {
        withCredentials: true,
      });
      
      if (response.data) {
        setPortfolio(response.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Portfolio fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load portfolio.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (type) => {
    try {
      setError(null);
      
      if (!stockInput.code || !stockInput.quantity || !currentPrice) {
        setError('Please fill in all fields and ensure stock price is loaded');
        return;
      }

      const payload = {
        code: stockInput.code,
        quantity: parseInt(stockInput.quantity),
        price: parseFloat(currentPrice)
      };

      if (isNaN(payload.quantity) || isNaN(payload.price)) {
        setError('Invalid quantity or price');
        return;
      }

      const response = await apiClient.post(
        type === 'BUY' ? PRACTICE_ZONE_ROUTES.BUY : PRACTICE_ZONE_ROUTES.SELL,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data) {
        setPortfolio(response.data);
        setStockInput({ code: '', quantity: '', price: '' });
        setCurrentPrice(null);
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.response?.data?.error || `Failed to ${type.toLowerCase()} stock`);
    }
  };

  const renderNavigation = () => (
    <nav className="space-y-4">
      <button 
        onClick={() => handleNavigation('http://127.0.0.1:5500/index.html')}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-500/10 text-left"
      >
        <Home size={20} />
        <span>Dashboard</span>
      </button>
      
      <button 
        onClick={() => handleNavigation('http://localhost:5173/chat')}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-500/10 text-left"
      >
        <Users size={20} />
        <span>Community</span>
      </button>
      
      <button 
        className="w-full flex items-center space-x-3 p-3 rounded-lg bg-purple-500/10 text-purple-400 text-left"
      >
        <BarChart2 size={20} />
        <span>Practice Zone</span>
      </button>
      
      <button 
        onClick={() => handleNavigation('http://127.0.0.1:5500/index.html')}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-500/10 text-left"
      >
        <BookOpen size={20} />
        <span>Tutorial</span>
      </button>
      
      <button 
        onClick={() => handleNavigation('http://localhost:5173/profile')}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-500/10 text-left"
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </nav>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="w-48 bg-gray-900 text-gray-300 p-4 border-r border-gray-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-purple-400">Profit Pulse</h1>
          </div>
          {renderNavigation()}
        </div>
        <div className="flex-1 p-4">
          <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={initializeAndFetchPortfolio}
              className="mt-2 bg-red-900/30 text-red-300 px-4 py-2 rounded hover:bg-red-900/50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar Navigation */}
      <div className="w-48 bg-gray-900 text-gray-300 p-4 border-r border-gray-800">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-purple-400">Profit Pulse</h1>
        </div>
        {renderNavigation()}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portfolio Overview Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Portfolio Overview</h2>
            <div className="space-y-2 text-gray-300">
              <p className="text-lg">Balance: ${portfolio?.balance.toFixed(2)}</p>
              <p className="text-lg">Total Stocks: {portfolio?.stocks.length}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">Holdings</h3>
              {!portfolio?.stocks.length ? (
                <p className="text-gray-400">No stocks in portfolio</p>
              ) : (
                portfolio.stocks.map((stock) => (
                  <div key={stock.code} className="border-b border-gray-700 py-2 text-gray-300">
                    <p>
                      {stock.code}: {stock.quantity} shares @ ${stock.avgPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Value: ${(stock.quantity * stock.avgPrice).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trade Stocks Card */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Trade Stocks</h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Stock Symbol (e.g., AAPL)"
                  className="w-full p-2 pl-8 rounded bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  value={stockInput.code}
                  onChange={handleCodeChange}
                />
                {fetchingPrice ? (
                  <Loader2 className="absolute left-2 top-3 h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                )}
              </div>
              
              {priceError && (
                <div className="text-red-400 text-sm">{priceError}</div>
              )}
              
              {currentPrice && (
                <div className="text-purple-400 font-medium">
                  Current Price: ${currentPrice.toFixed(2)}
                </div>
              )}

              <input
                type="number"
                placeholder="Quantity"
                min="1"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-purple-500"
                value={stockInput.quantity}
                onChange={(e) => setStockInput({...stockInput, quantity: e.target.value})}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => handleTransaction('BUY')}
                  className="flex-1 bg-purple-600 text-white p-2 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!stockInput.code || !stockInput.quantity || !currentPrice}
                >
                  Buy
                </button>
                <button
                  onClick={() => handleTransaction('SELL')}
                  className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!stockInput.code || !stockInput.quantity || !currentPrice}
                >
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {portfolio?.transactions?.length > 0 && (
          <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Recent Transactions</h2>
            <div className="space-y-2">
              {portfolio.transactions.slice().reverse().slice(0, 5).map((transaction, index) => (
                <div key={index} className="border-b border-gray-700 py-2">
                  <p className="font-medium text-gray-300">
                    {transaction.type} {transaction.code}
                  </p>
                  <p className="text-sm text-gray-400">
                    {transaction.quantity} shares @ ${transaction.price.toFixed(2)} - 
                    {new Date(transaction.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeZone;