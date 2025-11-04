const API_URL = "https://expensetracker-backend-8uen.onrender.com/api";
let currentExpenseId = null;
let allExpenses = [];
let pieChart = null;
let barChart = null;

// Check authentication
if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

// Display user name
const user = JSON.parse(localStorage.getItem("user") || "{}");
document.getElementById("userName").textContent = user.name || "User";

// View Management
function showView(viewName) {
  // Hide all views
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });

  // Remove active class from all tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected view
  document.getElementById(`${viewName}-view`).classList.add("active");

  // Add active class to clicked tab
  event.target.classList.add("active");

  // Reset form when switching to add expense view
  if (viewName === "add-expense" && !currentExpenseId) {
    document.getElementById("expenseForm").reset();
  }
}

// Fetch and display all data
async function fetchExpenses() {
  try {
    const response = await fetch(`${API_URL}/expenses`, {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });

    if (!response.ok) throw new Error("Failed to fetch expenses");

    allExpenses = await response.json();

    filterExpenses();
    updateSummaryCards();
    updateCharts();
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    alert("Failed to load expenses. Please refresh the page.");
  }
}

// Filter expenses
function filterExpenses() {
  const period = document.getElementById("filterPeriod").value;
  const category = document.getElementById("filterCategory").value;

  let filtered = [...allExpenses];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "today") {
    filtered = filtered.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= today;
    });
  } else if (period === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = filtered.filter((exp) => new Date(exp.date) >= weekAgo);
  } else if (period === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = filtered.filter((exp) => new Date(exp.date) >= monthStart);
  }

  if (category !== "all") {
    filtered = filtered.filter((exp) => exp.category === category);
  }

  displayExpenses(filtered);
}

// Display expenses
function displayExpenses(expenses) {
  const container = document.getElementById("expenseListContainer");

  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No expenses found</h3>
        <p>Add your first expense to get started!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = expenses
    .map(
      (exp) => `
    <div class="expense-item">
      <div class="expense-info">
        <div class="expense-title">${exp.title}</div>
        <div class="expense-meta">
          <span class="expense-category">${exp.category}</span>
          <span>${new Date(exp.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}</span>
          ${exp.description ? `<span>${exp.description}</span>` : ""}
        </div>
      </div>
      <div class="expense-right">
        <div class="expense-amount">₹${exp.amount.toFixed(2)}</div>
        <div class="expense-actions">
          <button class="btn btn-warning" onclick="editExpense('${
            exp._id
          }')">Edit</button>
          <button class="btn btn-danger" onclick="deleteExpense('${
            exp._id
          }')">Delete</button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Update summary cards
function updateSummaryCards() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthlyTotal = allExpenses
    .filter((exp) => new Date(exp.date) >= monthStart)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const weeklyTotal = allExpenses
    .filter((exp) => new Date(exp.date) >= weekAgo)
    .reduce((sum, exp) => sum + exp.amount, 0);

  const daysInMonth = Math.max(1, (now - monthStart) / (1000 * 60 * 60 * 24));
  const dailyAverage = monthlyTotal / daysInMonth;

  document.getElementById("monthlyTotal").textContent = monthlyTotal.toFixed(2);
  document.getElementById("weeklyTotal").textContent = weeklyTotal.toFixed(2);
  document.getElementById("dailyAverage").textContent = dailyAverage.toFixed(2);
}

// Update charts
function updateCharts() {
  updatePieChart();
  updateBarChart();
}

// Pie Chart
function updatePieChart() {
  const categoryData = {};

  allExpenses.forEach((exp) => {
    categoryData[exp.category] = (categoryData[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);

  const colors = [
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#ec4899",
  ];

  const ctx = document.getElementById("pieChart");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            font: { size: 13, weight: "600" },
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ₹${value.toFixed(2)} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "65%",
    },
  });
}

// Bar Chart
function updateBarChart() {
  const dailyData = {};
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    dailyData[dateStr] = 0;
  }

  allExpenses.forEach((exp) => {
    const expDate = new Date(exp.date);
    const daysDiff = Math.floor((today - expDate) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff < 7) {
      const dateStr = expDate.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      if (dailyData.hasOwnProperty(dateStr)) {
        dailyData[dateStr] += exp.amount;
      }
    }
  });

  const labels = Object.keys(dailyData);
  const data = Object.values(dailyData);

  const ctx = document.getElementById("barChart");

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Spending",
          data: data,
          backgroundColor: "rgba(99, 102, 241, 0.8)",
          borderColor: "#6366f1",
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: "#4f46e5",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              return ` ₹${context.parsed.y.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: {
            font: { size: 12, weight: "600" },
            callback: function (value) {
              return "₹" + value;
            },
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, weight: "600" } },
        },
      },
    },
  });
}

// Form submission
document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  const data = {
    title: document.getElementById("title").value,
    amount: parseFloat(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    date: new Date().toISOString(),
  };

  const url = currentExpenseId
    ? `${API_URL}/expenses/${currentExpenseId}`
    : `${API_URL}/expenses`;

  const method = currentExpenseId ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": localStorage.getItem("token"),
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      document.getElementById("expenseForm").reset();
      currentExpenseId = null;
      document.getElementById("formTitle").textContent = "Add New Expense";
      document.getElementById("submitBtn").textContent = "✓ Add Expense";
      document.getElementById("cancelBtn").style.display = "none";

      await fetchExpenses();

      // Switch to dashboard view
      document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.remove("active"));
      document.getElementById("dashboard-view").classList.add("active");
      document
        .querySelectorAll(".nav-tab")
        .forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".nav-tab")[0].classList.add("active");
    }
  } catch (err) {
    console.error("Failed to save expense:", err);
    alert("Failed to save expense. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Delete expense
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: "DELETE",
      headers: { "x-auth-token": localStorage.getItem("token") },
    });

    if (response.ok) {
      await fetchExpenses();
    }
  } catch (err) {
    console.error("Failed to delete expense:", err);
    alert("Failed to delete expense. Please try again.");
  }
}

// Edit expense
function editExpense(id) {
  const expense = allExpenses.find((e) => e._id === id);
  if (!expense) return;

  currentExpenseId = id;
  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("description").value = expense.description || "";

  document.getElementById("formTitle").textContent = "Edit Expense";
  document.getElementById("submitBtn").textContent = "✓ Update Expense";
  document.getElementById("cancelBtn").style.display = "inline-block";

  // Switch to add expense view
  showView("add-expense");
}

// Cancel edit
function cancelEdit() {
  currentExpenseId = null;
  document.getElementById("expenseForm").reset();
  document.getElementById("formTitle").textContent = "Add New Expense";
  document.getElementById("submitBtn").textContent = "✓ Add Expense";
  document.getElementById("cancelBtn").style.display = "none";
}

// Logout
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}

// Initial load
fetchExpenses();
