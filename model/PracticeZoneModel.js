import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', // Updated to match your existing User model name
        required: true
    },
    balance: {
        type: Number,
        default: 10000,
        min: 0
    },
    stocks: [{
        code: {
            type: String,
            required: true,
            uppercase: true // Automatically convert stock codes to uppercase
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        avgPrice: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    transactions: [{
        type: {
            type: String,
            enum: ['BUY', 'SELL'],
            required: true
        },
        code: {
            type: String,
            required: true,
            uppercase: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update lastUpdated timestamp
portfolioSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Add methods to calculate portfolio value, returns, etc.
portfolioSchema.methods.calculatePortfolioValue = async function(currentPrices) {
    const stocksValue = this.stocks.reduce((total, stock) => {
        const currentPrice = currentPrices[stock.code] || stock.avgPrice;
        return total + (stock.quantity * currentPrice);
    }, 0);
    return stocksValue + this.balance;
};

portfolioSchema.methods.calculateReturns = async function(currentPrices) {
    const currentValue = await this.calculatePortfolioValue(currentPrices);
    const investedValue = this.stocks.reduce((total, stock) => {
        return total + (stock.quantity * stock.avgPrice);
    }, 0);
    return {
        absoluteReturn: currentValue - investedValue,
        percentageReturn: ((currentValue - investedValue) / investedValue) * 100
    };
};

// Static method to find user's portfolio with validation
portfolioSchema.statics.findUserPortfolio = async function(userId) {
    const portfolio = await this.findOne({ userId });
    if (!portfolio) {
        throw new Error('Portfolio not found');
    }
    return portfolio;
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;