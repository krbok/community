import Portfolio from '../model/PracticeZoneModel.js';
import User from '../model/UserModel.js';

export const initializePortfolio = async (req, res) => {
    try {
        const userId = req.userId; // From your auth middleware
        // Check if portfolio exists
        let portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            // Create new portfolio with initial balance
            portfolio = await Portfolio.create({
                userId,
                balance: 10000,
                stocks: [],
                transactions: []
            });
        }
        
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPortfolio = async (req, res) => {
    try {
        const userId = req.userId;
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }
        
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const buyStock = async (req, res) => {
    try {
        const userId = req.userId;
        const { code, quantity, price } = req.body;

        // Input validation
        if (!code || !quantity || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (quantity <= 0 || price <= 0) {
            return res.status(400).json({ error: "Invalid quantity or price" });
        }

        let portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }

        const totalCost = price * quantity;
        
        if (portfolio.balance < totalCost) {
            return res.status(400).json({ error: "Insufficient balance" });
        }

        // Find existing stock or create new entry
        const stockIndex = portfolio.stocks.findIndex(s => s.code === code.toUpperCase());
        
        if (stockIndex >= 0) {
            const existingStock = portfolio.stocks[stockIndex];
            const newQuantity = existingStock.quantity + quantity;
            const newAvgPrice = ((existingStock.avgPrice * existingStock.quantity) + (price * quantity)) / newQuantity;
            
            portfolio.stocks[stockIndex].quantity = newQuantity;
            portfolio.stocks[stockIndex].avgPrice = newAvgPrice;
        } else {
            portfolio.stocks.push({ 
                code: code.toUpperCase(), 
                quantity, 
                avgPrice: price 
            });
        }

        // Update balance and add transaction
        portfolio.balance -= totalCost;
        portfolio.transactions.push({
            type: "BUY",
            code: code.toUpperCase(),
            quantity,
            price,
            timestamp: new Date()
        });

        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sellStock = async (req, res) => {
    try {
        const userId = req.userId;
        const { code, quantity, price } = req.body;

        // Input validation
        if (!code || !quantity || !price) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (quantity <= 0 || price <= 0) {
            return res.status(400).json({ error: "Invalid quantity or price" });
        }

        let portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }

        const stock = portfolio.stocks.find(s => s.code === code.toUpperCase());
        
        if (!stock || stock.quantity < quantity) {
            return res.status(400).json({ error: "Insufficient stock quantity" });
        }

        // Update stock quantity
        stock.quantity -= quantity;
        const saleAmount = price * quantity;

        // Remove stock if quantity becomes 0
        if (stock.quantity === 0) {
            portfolio.stocks = portfolio.stocks.filter(s => s.code !== code.toUpperCase());
        }

        // Update balance and add transaction
        portfolio.balance += saleAmount;
        portfolio.transactions.push({
            type: "SELL",
            code: code.toUpperCase(),
            quantity,
            price,
            timestamp: new Date()
        });

        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add helper function to calculate portfolio statistics
export const getPortfolioStats = async (req, res) => {
    try {
        const userId = req.userId;
        const portfolio = await Portfolio.findOne({ userId });
        
        if (!portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }

        // Calculate total investment value
        const totalInvestment = portfolio.stocks.reduce((total, stock) => {
            return total + (stock.quantity * stock.avgPrice);
        }, 0);

        // Calculate number of different stocks
        const numberOfStocks = portfolio.stocks.length;

        // Get latest transaction
        const latestTransaction = portfolio.transactions[portfolio.transactions.length - 1];

        const stats = {
            totalInvestment,
            availableBalance: portfolio.balance,
            numberOfStocks,
            latestTransaction,
            totalPortfolioValue: totalInvestment + portfolio.balance
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};