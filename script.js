// ─── STATE ───────────────────────────────────────────
let balance = 0;
let expenses = [];

const CATEGORY_ICONS = {
    Food: '🍜',
    Transport: '🚗',
    Shopping: '🛍️',
    Health: '💊',
    Bills: '📄',
    Entertainment: '🎮',
    Other: '📦'
};

const CHART_COLORS = [
    '#38B200', '#00b894', '#00cec9', '#0984e3',
    '#6c5ce7', '#fd79a8', '#e17055', '#fdcb6e'
];

// ─── DOM REFS ─────────────────────────────────────────
const balanceDisplay = document.getElementById('balanceDisplay');
const balanceInput   = document.getElementById('balanceInput');
const setBalanceBtn  = document.getElementById('setBalanceBtn');
const expenseName    = document.getElementById('expenseName');
const expenseAmount  = document.getElementById('expenseAmount');
const expenseCategory= document.getElementById('expenseCategory');
const addExpenseBtn  = document.getElementById('addExpenseBtn');
const expenseList    = document.getElementById('expenseList');
const totalSpent     = document.getElementById('totalSpent');
const chartCenter    = document.getElementById('chartCenter');
const chartLegend    = document.getElementById('chartLegend');

// ─── CANVAS PIE CHART ─────────────────────────────────
const canvas = document.getElementById('pieChart');
const ctx = canvas.getContext('2d');
canvas.width = 220;
canvas.height = 220;

// ─── FORMAT CURRENCY ─────────────────────────────────
function formatRp(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

// ─── SET BALANCE ──────────────────────────────────────
setBalanceBtn.addEventListener('click', () => {
    const val = parseFloat(balanceInput.value);
    if (isNaN(val) || val < 0) return shake(balanceInput);
    balance = val;
    balanceInput.value = '';
    render();
});

balanceInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') setBalanceBtn.click();
});

// ─── ADD EXPENSE ──────────────────────────────────────
addExpenseBtn.addEventListener('click', () => {
    const name   = expenseName.value.trim();
    const amount = parseFloat(expenseAmount.value);
    const cat    = expenseCategory.value;

    if (!name) return shake(expenseName);
    if (isNaN(amount) || amount <= 0) return shake(expenseAmount);

    expenses.push({ id: Date.now(), name, amount, category: cat });
    expenseName.value = '';
    expenseAmount.value = '';
    render();
});

expenseAmount.addEventListener('keydown', e => {
    if (e.key === 'Enter') addExpenseBtn.click();
});

// ─── DELETE EXPENSE ───────────────────────────────────
function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    render();
}

// ─── RENDER ───────────────────────────────────────────
function render() {
    renderBalance();
    renderList();
    renderChart();
}

function renderBalance() {
    balanceDisplay.textContent = formatRp(balance);
}

function renderList() {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    totalSpent.textContent = 'Spent: ' + formatRp(total);

    if (expenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">receipt_long</span>
                <p>No expenses yet</p>
            </div>`;
        return;
    }

    expenseList.innerHTML = expenses.map(e => `
        <div class="expense-item" id="item-${e.id}">
            <div class="expense-left">
                <div class="expense-icon">${CATEGORY_ICONS[e.category] || '📦'}</div>
                <div class="expense-info">
                    <span class="expense-name">${e.name}</span>
                    <span class="expense-category">${e.category}</span>
                </div>
            </div>
            <div class="expense-right">
                <span class="expense-amount">${formatRp(e.amount)}</span>
                <button class="btn-delete" onclick="deleteExpense(${e.id})">
                    <span class="material-icons">delete_outline</span>
                </button>
            </div>
        </div>
    `).join('');
}

// ─── PIE CHART ────────────────────────────────────────
function renderChart() {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const usedPct = balance > 0 ? Math.min(100, Math.round((total / balance) * 100)) : 0;

    // Update center text
    chartCenter.innerHTML = `
        <span class="chart-center-value">${usedPct}%</span>
        <span class="chart-center-label">used</span>
    `;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total === 0) {
        // Draw empty donut
        drawArc(0, Math.PI * 2, 'rgba(255,255,255,0.06)');
        renderLegend([]);
        return;
    }

    // Group by category
    const groups = {};
    expenses.forEach(e => {
        groups[e.category] = (groups[e.category] || 0) + e.amount;
    });

    const entries = Object.entries(groups);
    let startAngle = -Math.PI / 2;

    entries.forEach(([cat, amt], i) => {
        const slice = (amt / total) * Math.PI * 2;
        drawArc(startAngle, startAngle + slice, CHART_COLORS[i % CHART_COLORS.length]);
        startAngle += slice;
    });

    renderLegend(entries, total);
}

function drawArc(start, end, color) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outerR = 95;
    const innerR = 62;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, start, end);
    ctx.arc(cx, cy, innerR, end, start, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function renderLegend(entries, total) {
    if (entries.length === 0) {
        chartLegend.innerHTML = `<p class="legend-empty">Add expenses to see breakdown</p>`;
        return;
    }

    chartLegend.innerHTML = entries.map(([cat, amt], i) => {
        const pct = Math.round((amt / total) * 100);
        return `
            <div class="legend-item">
                <div class="legend-left">
                    <div class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></div>
                    <span class="legend-name">${CATEGORY_ICONS[cat]} ${cat}</span>
                </div>
                <span class="legend-pct">${pct}% · ${formatRp(amt)}</span>
            </div>
        `;
    }).join('');
}

// ─── SHAKE ANIMATION ──────────────────────────────────
function shake(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shakeInput 0.4s ease';
    el.focus();
    setTimeout(() => el.style.animation = '', 400);
}

// Add shake keyframes dynamically
const style = document.createElement('style');
style.textContent = `
@keyframes shakeInput {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
}`;
document.head.appendChild(style);

// ─── INIT ─────────────────────────────────────────────
render();