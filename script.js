// DOM Elements
const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const currentDateElement = document.getElementById("current-date");
const totalAmountElement = document.getElementById("total-amount");
const categoryListElement = document.getElementById("category-list");
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");
const periodButtons = document.querySelectorAll(".period-btn");

// Set today's date as default
document.getElementById("date").valueAsDate = new Date();

// Data
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let filteredExpenses = [...expenses];
let currentPeriod = "today"; // Default period

// Category Icons Map
const categoryIcons = {
    "Food": "🍔",
    "Travel": "🚗",
    "Shopping": "🛍️",
    "Entertainment": "🎬",
    "Healthcare": "🏥",
    "Utilities": "💡",
    "Other": "🔖"
};

// Initialize
init();

function init() {
    updateCurrentDate();
    renderExpenses();
    updateSummary();
    updateCategoryBreakdown();
    setupPeriodButtons();
}

// Setup period buttons
function setupPeriodButtons() {
    periodButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            periodButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPeriod = btn.dataset.period;
            updateSummary();
            updateCategoryBreakdown();
        });
    });
}

// Get expenses for current period
function getExpensesForPeriod() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.toISOString().slice(0, 7);

    switch(currentPeriod) {
        case "today":
            return expenses.filter(exp => exp.date === todayStr);
        case "month":
            return expenses.filter(exp => exp.date.startsWith(currentMonth));
        case "total":
            return expenses;
        default:
            return expenses;
    }
}

// Get period label
function getPeriodLabel() {
    switch(currentPeriod) {
        case "today": return "Today";
        case "month": return "This Month";
        case "total": return "All Time";
        default: return "Total";
    }
}

// Update current date display
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    currentDateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Add expense form submission
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const date = document.getElementById("date").value;

    if (category && description && amount && date) {
        const newExpense = {
            id: Date.now(),
            category,
            description,
            amount,
            date
        };

        // Add with animation
        expenses.push(newExpense);
        saveExpenses();
        form.reset();
        document.getElementById("date").valueAsDate = new Date();
        
        // Animate update
        renderExpenses();
        updateSummary();
        updateCategoryBreakdown();
        
        // Show success feedback
        showNotification("✅ Expense added successfully!");
    }
});

// Show notification
function showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInFromLeft 0.4s ease;
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOutDown 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Render expenses
function renderExpenses() {
    expenseList.innerHTML = "";

    // Apply filters
    filteredExpenses = expenses.filter(exp => {
        const matchesCategory = !filterCategory.value || exp.category === filterCategory.value;
        const matchesSearch = !searchInput.value || 
                            exp.description.toLowerCase().includes(searchInput.value.toLowerCase()) ||
                            exp.category.toLowerCase().includes(searchInput.value.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = '<div class="empty-state">📭 No expenses found. Add one to get started!</div>';
        return;
    }

    filteredExpenses.forEach((exp, index) => {
        const div = document.createElement("div");
        div.classList.add("expense-item");
        
        const categoryEmoji = categoryIcons[exp.category] || "🔖";
        const formattedDate = new Date(exp.date).toLocaleDateString('en-US', 
            { month: 'short', day: 'numeric', year: 'numeric' });

        div.innerHTML = `
            <div class="expense-item-content">
                <div class="expense-header">
                    <span class="expense-category-icon">${categoryEmoji}</span>
                    <span>${exp.category}</span>
                </div>
                <div class="expense-description">${exp.description}</div>
                <div class="expense-date">${formattedDate}</div>
            </div>
            <div class="expense-right">
                <div class="expense-amount">₹${exp.amount.toFixed(2)}</div>
                <button class="btn-delete" onclick="deleteExpense(${exp.id})" title="Delete">❌</button>
            </div>
        `;
        expenseList.appendChild(div);
    });
}

// Delete expense with animation
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        const expenseElement = event.target.closest(".expense-item");
        if (expenseElement) {
            expenseElement.classList.add("fade-out");
            setTimeout(() => {
                expenses = expenses.filter(exp => exp.id !== id);
                saveExpenses();
                renderExpenses();
                updateSummary();
                updateCategoryBreakdown();
                showNotification("🗑️ Expense deleted!");
            }, 300);
        } else {
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateCategoryBreakdown();
        }
    }
}

// Update summary statistics with animation
function updateSummary() {
    const periodExpenses = getExpensesForPeriod();
    
    let totalAmount = 0;
    let countAmount = 0;

    periodExpenses.forEach(exp => {
        totalAmount += exp.amount;
        countAmount++;
    });

    const avgAmount = countAmount > 0 ? totalAmount / countAmount : 0;

    // Animate amount changes
    animateCounter(totalAmountElement, totalAmount);
    
    const avgElement = document.getElementById("avg-amount");
    const countElement = document.getElementById("count-amount");
    
    animateCounter(avgElement, avgAmount);
    animateCounter(countElement, countAmount, true);

    // Update period label
    const periodLabel = getPeriodLabel();
    document.querySelector(".summary-label") && 
        (document.querySelector(".summary-label").textContent = periodLabel);
}

// Animate counter
function animateCounter(element, targetValue, isInteger = false) {
    const startValue = parseFloat(element.textContent.replace('₹', '').replace(/,/g, '')) || 0;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = startValue + (targetValue - startValue) * progress;

        if (isInteger) {
            element.textContent = Math.floor(currentValue);
        } else {
            element.textContent = '₹' + currentValue.toFixed(2);
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    animate();
}

// Update category breakdown with visual progress bars
function updateCategoryBreakdown() {
    const categoryTotals = {};

    getExpensesForPeriod().forEach(exp => {
        if (!categoryTotals[exp.category]) {
            categoryTotals[exp.category] = 0;
        }
        categoryTotals[exp.category] += exp.amount;
    });

    categoryListElement.innerHTML = "";

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const maxAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

    sortedCategories.forEach(([category, total], index) => {
        const categoryEmoji = categoryIcons[category] || "🔖";
        const percentage = maxAmount > 0 ? (total / maxAmount) * 100 : 0;
        
        const div = document.createElement("div");
        div.classList.add("category-item");
        div.style.animationDelay = `${index * 0.1}s`;
        
        div.innerHTML = `
            <div class="category-item-wrapper">
                <div class="category-item-name">
                    <span>${categoryEmoji}</span>
                    <span>${category}</span>
                </div>
                <div class="category-item-amount">₹${total.toFixed(2)}</div>
            </div>
            <div class="category-progress">
                <div class="category-progress-bar" style="--fill-width: ${percentage}%"></div>
            </div>
        `;
        categoryListElement.appendChild(div);
    });

    if (sortedCategories.length === 0) {
        categoryListElement.innerHTML = '<p style="color: #999; text-align: center; padding: 1rem;">No data yet</p>';
    }

    // Update chart
    updateChart(categoryTotals);
}

// Create and update visual chart
function updateChart(categoryTotals) {
    const chartContainer = document.getElementById("chart-container");
    chartContainer.innerHTML = "";

    if (Object.keys(categoryTotals).length === 0) return;

    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([category, amount]) => {
            const percentage = (amount / total) * 100;
            const colors = {
                "Food": "#ff6b6b",
                "Travel": "#4ecdc4",
                "Shopping": "#ff9f43",
                "Entertainment": "#a55eea",
                "Healthcare": "#48dbfb",
                "Utilities": "#1dd1a1",
                "Other": "#5f27cd"
            };

            const color = colors[category] || "#5c63f5";

            const div = document.createElement("div");
            div.style.cssText = `
                margin-bottom: 0.75rem;
            `;
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.85rem;">
                    <span>${category}</span>
                    <span style="font-weight: 600;">${percentage.toFixed(1)}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: ${color}; width: ${percentage}%; animation: progressFill 0.8s ease forwards;"></div>
                </div>
            `;
            chartContainer.appendChild(div);
        });
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Search functionality with debounce
let searchTimeout;
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        renderExpenses();
    }, 300);
});

// Filter functionality
filterCategory.addEventListener("change", renderExpenses);

// Export expenses as CSV
exportBtn.addEventListener("click", function () {
    if (expenses.length === 0) {
        alert("No expenses to export!");
        return;
    }

    let csv = "Date,Category,Description,Amount\n";
    expenses.forEach(exp => {
        csv += `"${exp.date}","${exp.category}","${exp.description}","${exp.amount}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification("📥 Expenses exported!");
});

// Clear all expenses
clearBtn.addEventListener("click", function () {
    if (expenses.length === 0) {
        alert("No expenses to clear!");
        return;
    }

    if (confirm("Are you sure you want to delete ALL expenses? This cannot be undone!")) {
        expenses = [];
        saveExpenses();
        renderExpenses();
        updateSummary();
        updateCategoryBreakdown();
        showNotification("🗑️ All expenses cleared!");
    }
});