// ------------------------------
// 1. OOP: Expense Model Class
// ------------------------------
class Expense {
    constructor(id, description, amount, category) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.createdAt = new Date().toISOString();
    }

    getFormattedAmount() {
        return `$${this.amount.toFixed(2)}`;
    }
}

// ------------------------------
// 2. ExpenseTracker Manager Class
// ------------------------------
class ExpenseTracker {
    constructor() {
        this.expenses = this._loadFromStorage();
    }

    _loadFromStorage() {
        const stored = localStorage.getItem('expense_tracker_data');
        if (!stored) return [];
        try {
            const parsed = JSON.parse(stored);
            return parsed.map(exp => new Expense(exp.id, exp.description, exp.amount, exp.category));
        } catch (e) {
            return [];
        }
    }

    _persist() {
        localStorage.setItem('expense_tracker_data', JSON.stringify(this.expenses));
    }

    addExpense(description, amount, category) {
        if (!description || description.trim() === "") throw new Error("Description is required");
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) throw new Error("Amount must be a positive number");
        
        const newId = Date.now() + Math.floor(Math.random() * 10000);
        const newExpense = new Expense(newId, description.trim(), numericAmount, category);
        this.expenses = [...this.expenses, newExpense];
        this._persist();
        return newExpense;
    }

    removeExpense(expenseId) {
        const initialLength = this.expenses.length;
        this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
        if (this.expenses.length !== initialLength) {
            this._persist();
            return true;
        }
        return false;
    }

    getAllExpenses() {
        return [...this.expenses];
    }

    filterByCategory(category) {
        if (!category || category === "ALL") return [...this.expenses];
        return this.expenses.filter(expense => {
            const { category: expCategory } = expense;
            return expCategory === category;
        });
    }

    getTotalExpenses() {
        return this.expenses.reduce((total, expense) => {
            const { amount } = expense;
            return total + amount;
        }, 0);
    }

    addMultipleExpenses(...expenseItems) {
        const added = [];
        for (const item of expenseItems) {
            const { description, amount, category } = item;
            try {
                const newExp = this.addExpense(description, amount, category);
                added.push(newExp);
            } catch (err) {
                console.warn("Skipping invalid expense", err.message);
            }
        }
        return added;
    }

    getUniqueCategories() {
        const cats = this.expenses.map(exp => exp.category);
        return [...new Set(cats)];
    }
}

// ------------------------------
// 3. UI Controller
// ------------------------------
class ExpenseTrackerUI {
    constructor(trackerInstance) {
        this.tracker = trackerInstance;
        this.descInput = document.getElementById('descInput');
        this.amountInput = document.getElementById('amountInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.addBtn = document.getElementById('addExpenseBtn');
        this.expenseListDiv = document.getElementById('expenseList');
        this.totalAmountSpan = document.getElementById('totalAmountDisplay');
        this.categoryFilterSelect = document.getElementById('categoryFilter');
        this.expenseCountSpan = document.getElementById('expenseCountInfo');
        
        this.currentFilter = "ALL";
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.handleAddExpense());
        this.categoryFilterSelect.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.render();
        });
        this.descInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleAddExpense(); });
        this.amountInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleAddExpense(); });
    }

    handleAddExpense() {
        const description = this.descInput.value;
        const amountRaw = this.amountInput.value;
        const category = this.categorySelect.value;
        
        try {
            const addedExpense = this.tracker.addExpense(description, amountRaw, category);
            this.descInput.value = '';
            this.amountInput.value = '';
            this.render();
            this.showTemporaryMessage(`✅ Added: ${addedExpense.description} - $${addedExpense.amount.toFixed(2)}`);
        } catch (error) {
            alert(error.message);
        }
    }

    handleDeleteExpense(expenseId) {
        const success = this.tracker.removeExpense(expenseId);
        if (success) {
            this.render();
            this.showTemporaryMessage(`🗑️ Expense removed`);
        }
    }

    showTemporaryMessage(msg) {
        this.expenseCountSpan.innerText = `✨ ${msg}`;
        setTimeout(() => {
            if (this.expenseCountSpan) this.renderStats();
        }, 1500);
    }

    renderStats() {
        const total = this.tracker.getTotalExpenses();
        this.totalAmountSpan.innerText = `$${total.toFixed(2)}`;
        const filteredExpenses = this.tracker.filterByCategory(this.currentFilter);
        const count = filteredExpenses.length;
        const allCount = this.tracker.getAllExpenses().length;
        this.expenseCountSpan.innerText = `📊 ${count} / ${allCount} expenses shown`;
    }

    render() {
        const filtered = this.tracker.filterByCategory(this.currentFilter);
        this.renderStats();
        
        if (filtered.length === 0) {
            this.expenseListDiv.innerHTML = `<div class="empty-message">🧾 No expenses found. ${this.currentFilter !== "ALL" ? `Try changing category filter.` : `Add your first expense!`}</div>`;
            return;
        }
        
        const expensesHTML = filtered.map(expense => {
            const { id, description, amount, category } = expense;
            const formattedAmount = `$${amount.toFixed(2)}`;
            let categoryEmoji = "";
            switch(category) {
                case "Food": categoryEmoji = "🍔"; break;
                case "Transport": categoryEmoji = "🚗"; break;
                case "Entertainment": categoryEmoji = "🎬"; break;
                case "Shopping": categoryEmoji = "🛍️"; break;
                case "Bills": categoryEmoji = "⚡"; break;
                default: categoryEmoji = "📌";
            }
            return `
                <div class="expense-item" data-id="${id}">
                    <div class="expense-info">
                        <div class="expense-desc">${this.escapeHtml(description)}</div>
                        <div class="expense-meta">
                            <span class="expense-category">${categoryEmoji} ${category}</span>
                        </div>
                    </div>
                    <div class="expense-amount">${formattedAmount}</div>
                    <button class="delete-btn" data-id="${id}">✖ Remove</button>
                </div>
            `;
        }).join('');
        
        this.expenseListDiv.innerHTML = expensesHTML;
        
        const deleteButtons = this.expenseListDiv.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = parseInt(btn.getAttribute('data-id'));
                if (!isNaN(expenseId)) {
                    this.handleDeleteExpense(expenseId);
                }
            });
        });
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
}

// ------------------------------
// 4. Initialize Application
// ------------------------------
const globalTracker = new ExpenseTracker();
const ui = new ExpenseTrackerUI(globalTracker);



// Export for Jest testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Expense, ExpenseTracker };
}