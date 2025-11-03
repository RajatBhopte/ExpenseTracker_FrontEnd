const API_URL = "http://localhost:5000/api";
let currentExpenseId = null;

// Check authentication
if (!localStorage.getItem("token")) {
  window.location.href = "login.html";
}

// Fetch expenses
async function fetchExpenses() {
  try {
    const response = await fetch(`${API_URL}/expenses`, {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const expenses = await response.json();
    displayExpenses(expenses);
  } catch (err) {
    console.error(err);
  }
}

// Display expenses
function displayExpenses(expenses) {
  const list = document.getElementById("expenseList");
  list.innerHTML = expenses
    .map(
      (exp) => `
    <div class="expense-item">
      <div>
        <strong>${exp.title}</strong> - ₹${exp.amount}<br>
        <small>${exp.category} | ${new Date(
        exp.date
      ).toLocaleDateString()}</small>
      </div>
      <div>
        <button class="btn-edit" onclick="editExpense('${
          exp._id
        }')">Edit</button>
        <button class="btn-delete" onclick="deleteExpense('${
          exp._id
        }')">Delete</button>
      </div>
    </div>
  `
    )
    .join("");
}

// Add/Update expense
document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById("title").value,
    amount: document.getElementById("amount").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
  };

  const url = currentExpenseId
    ? `${API_URL}/expenses/${currentExpenseId}`
    : `${API_URL}/expenses`;

  const method = currentExpenseId ? "PUT" : "POST";

  try {
    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": localStorage.getItem("token"),
      },
      body: JSON.stringify(data),
    });

    document.getElementById("expenseForm").reset();
    currentExpenseId = null;
    fetchExpenses();
  } catch (err) {
    console.error(err);
  }
});

// Delete expense
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  try {
    await fetch(`${API_URL}/expenses/${id}`, {
      method: "DELETE",
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    fetchExpenses();
  } catch (err) {
    console.error(err);
  }
}

// Edit expense
async function editExpense(id) {
  currentExpenseId = id;
  const response = await fetch(`${API_URL}/expenses`, {
    headers: { "x-auth-token": localStorage.getItem("token") },
  });
  const expenses = await response.json();
  const expense = expenses.find((e) => e._id === id);

  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("description").value = expense.description;
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Initial load
fetchExpenses();
