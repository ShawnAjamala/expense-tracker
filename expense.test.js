const { Expense, ExpenseTracker } = require('../script.js');

describe('Expense Tracker Unit Tests', () => {
    let tracker;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        tracker = new ExpenseTracker();
    });
    
    // ========== ADDING EXPENSES TESTS ==========
    describe('Adding Expenses', () => {
        test('should add a valid expense successfully', () => {
            const expense = tracker.addExpense('Coffee', 4.50, 'Food');
            
            expect(expense).toBeDefined();
            expect(expense.description).toBe('Coffee');
            expect(expense.amount).toBe(4.50);
            expect(expense.category).toBe('Food');
            expect(tracker.getAllExpenses().length).toBe(1);
        });
        
        test('should generate unique id for each expense', () => {
            const expense1 = tracker.addExpense('Coffee', 4.50, 'Food');
            const expense2 = tracker.addExpense('Tea', 3.00, 'Food');
            
            expect(expense1.id).not.toBe(expense2.id);
        });
        
        test('should throw error when description is empty', () => {
            expect(() => {
                tracker.addExpense('', 10, 'Food');
            }).toThrow('Description is required');
            
            expect(() => {
                tracker.addExpense('   ', 20, 'Transport');
            }).toThrow('Description is required');
            
            expect(() => {
                tracker.addExpense(null, 15, 'Food');
            }).toThrow('Description is required');
        });
        
        test('should throw error when amount is invalid', () => {
            expect(() => {
                tracker.addExpense('Lunch', -5, 'Food');
            }).toThrow('Amount must be a positive number');
            
            expect(() => {
                tracker.addExpense('Dinner', 'abc', 'Food');
            }).toThrow('Amount must be a positive number');
            
            expect(() => {
                tracker.addExpense('Snack', 0, 'Food');
            }).toThrow('Amount must be a positive number');
            
            expect(() => {
                tracker.addExpense('Drink', NaN, 'Food');
            }).toThrow('Amount must be a positive number');
        });
        
        test('should handle decimal amounts correctly', () => {
            const expense = tracker.addExpense('Fancy Coffee', 4.99, 'Food');
            expect(expense.amount).toBe(4.99);
            expect(tracker.getTotalExpenses()).toBeCloseTo(4.99, 2);
        });
        
        test('should add multiple expenses using rest operator', () => {
            const added = tracker.addMultipleExpenses(
                { description: 'Item1', amount: 10, category: 'Shopping' },
                { description: 'Item2', amount: 20, category: 'Food' },
                { description: 'Item3', amount: 30, category: 'Transport' }
            );
            
            expect(added.length).toBe(3);
            expect(tracker.getAllExpenses().length).toBe(3);
            expect(tracker.getTotalExpenses()).toBe(60);
        });
        
        test('should skip invalid expenses when using addMultipleExpenses', () => {
            const added = tracker.addMultipleExpenses(
                { description: 'Valid', amount: 10, category: 'Food' },
                { description: '', amount: 20, category: 'Food' }, // invalid
                { description: 'Valid2', amount: -5, category: 'Food' }, // invalid
                { description: 'Valid3', amount: 15, category: 'Transport' }
            );
            
            expect(added.length).toBe(2); // Only the valid ones
            expect(tracker.getAllExpenses().length).toBe(2);
        });
    });
    
    // ========== REMOVING EXPENSES TESTS ==========
    describe('Removing Expenses', () => {
        test('should remove an existing expense', () => {
            const expense1 = tracker.addExpense('Coffee', 4.50, 'Food');
            const expense2 = tracker.addExpense('Bus', 2.50, 'Transport');
            
            expect(tracker.getAllExpenses().length).toBe(2);
            
            const removed = tracker.removeExpense(expense1.id);
            expect(removed).toBe(true);
            expect(tracker.getAllExpenses().length).toBe(1);
            expect(tracker.getAllExpenses()[0].id).toBe(expense2.id);
        });
        
        test('should return false when removing non-existent expense', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            const result = tracker.removeExpense(99999);
            
            expect(result).toBe(false);
            expect(tracker.getAllExpenses().length).toBe(1);
        });
        
        test('should remove expense and update localStorage', () => {
            const expense = tracker.addExpense('Test', 100, 'Shopping');
            expect(tracker.getAllExpenses().length).toBe(1);
            
            tracker.removeExpense(expense.id);
            
            const stored = localStorage.getItem('expense_tracker_data');
            const parsed = JSON.parse(stored);
            expect(parsed.length).toBe(0);
        });
        
        test('should handle removing from empty list gracefully', () => {
            const result = tracker.removeExpense(12345);
            expect(result).toBe(false);
            expect(tracker.getAllExpenses().length).toBe(0);
        });
    });
    
    // ========== CALCULATING TOTAL EXPENSES TESTS ==========
    describe('Calculating Total Expenses', () => {
        test('should return 0 when no expenses', () => {
            const total = tracker.getTotalExpenses();
            expect(total).toBe(0);
        });
        
        test('should calculate correct total for single expense', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            const total = tracker.getTotalExpenses();
            expect(total).toBe(4.50);
        });
        
        test('should calculate correct total for multiple expenses', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Lunch', 12.75, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            tracker.addExpense('Movie', 15.99, 'Entertainment');
            
            const total = tracker.getTotalExpenses();
            expect(total).toBeCloseTo(35.74, 2);
        });
        
        test('should update total after adding expense', () => {
            expect(tracker.getTotalExpenses()).toBe(0);
            
            tracker.addExpense('Item1', 100, 'Shopping');
            expect(tracker.getTotalExpenses()).toBe(100);
            
            tracker.addExpense('Item2', 50, 'Food');
            expect(tracker.getTotalExpenses()).toBe(150);
        });
        
        test('should update total after removing expense', () => {
            tracker.addExpense('Item1', 100, 'Shopping');
            const expense2 = tracker.addExpense('Item2', 50, 'Food');
            tracker.addExpense('Item3', 25, 'Transport');
            
            expect(tracker.getTotalExpenses()).toBe(175);
            
            tracker.removeExpense(expense2.id);
            expect(tracker.getTotalExpenses()).toBe(125);
        });
        
        test('should handle floating point precision correctly', () => {
            tracker.addExpense('Item1', 0.1, 'Food');
            tracker.addExpense('Item2', 0.2, 'Food');
            
            const total = tracker.getTotalExpenses();
            expect(total).toBeCloseTo(0.3, 10);
        });
    });
    
    // ========== FILTERING EXPENSES BY CATEGORY TESTS ==========
    describe('Filtering Expenses by Category', () => {
        test('should return all expenses when category is ALL', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            tracker.addExpense('Movie', 15, 'Entertainment');
            
            const allFiltered = tracker.filterByCategory('ALL');
            expect(allFiltered.length).toBe(3);
        });
        
        test('should return all expenses when category is undefined or null', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            
            const undefinedFilter = tracker.filterByCategory();
            expect(undefinedFilter.length).toBe(2);
            
            const nullFilter = tracker.filterByCategory(null);
            expect(nullFilter.length).toBe(2);
        });
        
        test('should filter correctly by specific category', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Pizza', 12, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            tracker.addExpense('Taxi', 8, 'Transport');
            tracker.addExpense('Movie', 15, 'Entertainment');
            tracker.addExpense('Netflix', 13.99, 'Entertainment');
            
            const foodExpenses = tracker.filterByCategory('Food');
            expect(foodExpenses.length).toBe(2);
            expect(foodExpenses.every(exp => exp.category === 'Food')).toBe(true);
            
            const transportExpenses = tracker.filterByCategory('Transport');
            expect(transportExpenses.length).toBe(2);
            
            const entertainmentExpenses = tracker.filterByCategory('Entertainment');
            expect(entertainmentExpenses.length).toBe(2);
        });
        
        test('should return empty array when category has no matches', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            
            const billsExpenses = tracker.filterByCategory('Bills');
            expect(billsExpenses.length).toBe(0);
            
            const shoppingExpenses = tracker.filterByCategory('Shopping');
            expect(shoppingExpenses.length).toBe(0);
        });
        
        test('should filter case-sensitively (exact match)', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Pizza', 12, 'food'); // lowercase
            
            const foodExpenses = tracker.filterByCategory('Food');
            expect(foodExpenses.length).toBe(1); // Only exact match
            expect(foodExpenses[0].description).toBe('Coffee');
        });
        
        test('should not mutate original expenses array when filtering', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            
            const originalExpenses = tracker.getAllExpenses();
            const filtered = tracker.filterByCategory('Food');
            
            expect(filtered).not.toBe(originalExpenses);
            expect(originalExpenses.length).toBe(2);
            expect(filtered.length).toBe(1);
        });
    });
    
    // ========== LOCAL STORAGE PERSISTENCE TESTS ==========
    describe('Local Storage Persistence', () => {
        test('should save expenses to localStorage when added', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Lunch', 12.75, 'Food');
            
            const stored = localStorage.getItem('expense_tracker_data');
            expect(stored).toBeDefined();
            
            const parsed = JSON.parse(stored);
            expect(parsed.length).toBe(2);
            expect(parsed[0].description).toBe('Coffee');
            expect(parsed[1].description).toBe('Lunch');
        });
        
        test('should save expenses to localStorage when removed', () => {
            const expense = tracker.addExpense('Test', 100, 'Shopping');
            tracker.removeExpense(expense.id);
            
            const stored = localStorage.getItem('expense_tracker_data');
            const parsed = JSON.parse(stored);
            expect(parsed.length).toBe(0);
        });
        
        test('should load expenses from localStorage on initialization', () => {
            // First tracker instance to save data
            const tracker1 = new ExpenseTracker();
            tracker1.addExpense('Saved Coffee', 5.99, 'Food');
            tracker1.addExpense('Saved Lunch', 12.50, 'Food');
            
            // Second tracker instance should load the data
            const tracker2 = new ExpenseTracker();
            const expenses = tracker2.getAllExpenses();
            
            expect(expenses.length).toBe(2);
            expect(expenses[0].description).toBe('Saved Coffee');
            expect(expenses[0].amount).toBe(5.99);
            expect(expenses[1].description).toBe('Saved Lunch');
        });
        
        test('should restore Expense class instances from localStorage', () => {
            tracker.addExpense('Test', 100, 'Shopping');
            
            const newTracker = new ExpenseTracker();
            const expenses = newTracker.getAllExpenses();
            
            expect(expenses[0] instanceof Expense).toBe(true);
            expect(typeof expenses[0].getFormattedAmount).toBe('function');
            expect(expenses[0].getFormattedAmount()).toBe('$100.00');
        });
        
        test('should handle corrupted localStorage data gracefully', () => {
            localStorage.setItem('expense_tracker_data', 'invalid json{{{');
            const tracker = new ExpenseTracker();
            
            expect(tracker.getAllExpenses()).toEqual([]);
            expect(() => tracker.addExpense('Test', 10, 'Food')).not.toThrow();
        });
        
        test('should handle empty localStorage', () => {
            localStorage.removeItem('expense_tracker_data');
            const tracker = new ExpenseTracker();
            
            expect(tracker.getAllExpenses()).toEqual([]);
        });
        
        test('should persist data after multiple operations', () => {
            tracker.addExpense('Item1', 10, 'Food');
            tracker.addExpense('Item2', 20, 'Transport');
            
            let stored = JSON.parse(localStorage.getItem('expense_tracker_data'));
            expect(stored.length).toBe(2);
            
            const expense = tracker.addExpense('Item3', 30, 'Entertainment');
            stored = JSON.parse(localStorage.getItem('expense_tracker_data'));
            expect(stored.length).toBe(3);
            
            tracker.removeExpense(expense.id);
            stored = JSON.parse(localStorage.getItem('expense_tracker_data'));
            expect(stored.length).toBe(2);
        });
    });
    
    // ========== EXPENSE CLASS TESTS ==========
    describe('Expense Class', () => {
        test('should create expense with correct properties', () => {
            const expense = new Expense(123, 'Test Expense', 99.99, 'Shopping');
            
            expect(expense.id).toBe(123);
            expect(expense.description).toBe('Test Expense');
            expect(expense.amount).toBe(99.99);
            expect(expense.category).toBe('Shopping');
            expect(expense.createdAt).toBeDefined();
            expect(typeof expense.createdAt).toBe('string');
        });
        
        test('should format amount correctly with two decimals', () => {
            const expense1 = new Expense(1, 'Item', 42.5, 'Food');
            expect(expense1.getFormattedAmount()).toBe('$42.50');
            
            const expense2 = new Expense(2, 'Item2', 7, 'Other');
            expect(expense2.getFormattedAmount()).toBe('$7.00');
            
            const expense3 = new Expense(3, 'Item3', 123.456, 'Food');
            expect(expense3.getFormattedAmount()).toBe('$123.46');
        });
        
        test('should handle zero amount', () => {
            const expense = new Expense(1, 'Free', 0, 'Other');
            expect(expense.getFormattedAmount()).toBe('$0.00');
        });
    });
    
    // ========== SPREAD AND REST OPERATORS TESTS ==========
    describe('Spread and Rest Operators', () => {
        test('should use spread operator to return copy of expenses', () => {
            tracker.addExpense('Item1', 10, 'Food');
            const expenses = tracker.getAllExpenses();
            const originalRef = tracker.expenses;
            
            // getAllExpenses should return a new array (spread copy)
            expect(expenses).not.toBe(originalRef);
            expect(expenses).toEqual(originalRef);
        });
        
        test('should use rest operator for addMultipleExpenses method', () => {
            const result = tracker.addMultipleExpenses(
                { description: 'A', amount: 1, category: 'Food' },
                { description: 'B', amount: 2, category: 'Transport' },
                { description: 'C', amount: 3, category: 'Entertainment' },
                { description: 'D', amount: 4, category: 'Shopping' }
            );
            
            expect(result.length).toBe(4);
            expect(tracker.getTotalExpenses()).toBe(10);
        });
        
        test('should handle empty rest parameters', () => {
            const result = tracker.addMultipleExpenses();
            expect(result).toEqual([]);
            expect(tracker.getAllExpenses().length).toBe(0);
        });
    });
    
    // ========== UTILITY METHOD TESTS ==========
    describe('Utility Methods', () => {
        test('getUniqueCategories should return unique categories', () => {
            tracker.addExpense('Item1', 10, 'Food');
            tracker.addExpense('Item2', 20, 'Transport');
            tracker.addExpense('Item3', 30, 'Food');
            tracker.addExpense('Item4', 40, 'Entertainment');
            tracker.addExpense('Item5', 50, 'Transport');
            
            const categories = tracker.getUniqueCategories();
            expect(categories).toContain('Food');
            expect(categories).toContain('Transport');
            expect(categories).toContain('Entertainment');
            expect(categories.length).toBe(3);
        });
        
        test('getUniqueCategories should return empty array when no expenses', () => {
            const categories = tracker.getUniqueCategories();
            expect(categories).toEqual([]);
        });
    });
    
    // ========== DESTRUCTURING TESTS ==========
    describe('Destructuring Usage', () => {
        test('should properly destructure expense objects in filterByCategory', () => {
            tracker.addExpense('Coffee', 4.50, 'Food');
            tracker.addExpense('Bus', 2.50, 'Transport');
            
            const filtered = tracker.filterByCategory('Food');
            expect(filtered.length).toBe(1);
            
            // Verify destructuring works (implicit test through functionality)
            const [expense] = filtered;
            expect(expense.category).toBe('Food');
        });
        
        test('should properly destructure in reduce method', () => {
            tracker.addExpense('Item1', 10, 'Food');
            tracker.addExpense('Item2', 20, 'Transport');
            
            const total = tracker.getTotalExpenses();
            expect(total).toBe(30);
        });
    });
});