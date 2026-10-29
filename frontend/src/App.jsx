import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const today = new Date().toISOString().split("T")[0];

/* =========================
   LOGIN / REGISTER
========================= */

function Auth({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || (register && !form.name)) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      if (register) {
        await api.post("/auth/register", form);

        alert("Registration successful. Please login.");

        setRegister(false);

        setForm({
          name: "",
          email: form.email,
          password: "",
        });
      } else {
        const { data } = await api.post("/auth/login", {
          email: form.email,
          password: form.password,
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.name);

        onLogin();
      }
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">₹</div>

        <h1>Budget Planner</h1>

        <p className="auth-subtitle">
          Manage your money. Track your goals. Build better financial habits.
        </p>

        <form onSubmit={submit}>
          {register && (
            <div className="input-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          <button
            className="primary-btn full-btn"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : register
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p
          className="auth-switch"
          onClick={() => {
            setRegister(!register);

            setForm({
              name: "",
              email: form.email,
              password: "",
            });
          }}
        >
          {register
            ? "Already have an account? Login"
            : "Don't have an account? Create an account"}
        </p>
      </div>
    </div>
  );
}

/* =========================
   DASHBOARD
========================= */

function Dashboard() {
  const [tab, setTab] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);

  const [form, setForm] = useState({});

  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const [budgetSearch, setBudgetSearch] = useState("");
  const [budgetMonth, setBudgetMonth] = useState("");

  const [goalSearch, setGoalSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem("name") || "User";

  /* =========================
     LOAD DATA
  ========================= */

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        dashboardRes,
        incomeRes,
        expenseRes,
        budgetRes,
        goalRes,
      ] = await Promise.all([
        api.get("/dashboard"),
        api.get("/income"),
        api.get("/expenses"),
        api.get("/budgets"),
        api.get("/goals"),
      ]);

      setDashboard(dashboardRes.data);
      setIncome(incomeRes.data);
      setExpenses(expenseRes.data);
      setBudgets(budgetRes.data);
      setGoals(goalRes.data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to load your financial data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     FORM UPDATE
  ========================= */

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* =========================
     ADD DATA
  ========================= */

  const add = async (type) => {
    try {
      /* INCOME */

      if (type === "income") {
        if (!form.source || !form.amount) {
          alert("Please enter income source and amount.");
          return;
        }

        await api.post("/income", {
          source: form.source,
          amount: Number(form.amount),
          category: form.category || "Other",
          date: form.date || today,
        });
      }

      /* EXPENSE */

      if (type === "expenses") {
        if (!form.category || !form.amount) {
          alert("Please enter expense category and amount.");
          return;
        }

        await api.post("/expenses", {
          category: form.category,
          description: form.description || "",
          amount: Number(form.amount),
          date: form.date || today,
        });
      }

      /* BUDGET */

      if (type === "budgets") {
        if (!form.category || !form.amount || !form.month) {
          alert("Please fill all budget fields.");
          return;
        }

        await api.post("/budgets", {
          category: form.category,
          amount: Number(form.amount),
          month: form.month,
        });
      }

      /* GOAL */

      if (type === "goals") {
        if (!form.title || !form.target) {
          alert("Please enter goal title and target amount.");
          return;
        }

        await api.post("/goals", {
          title: form.title,
          target: Number(form.target),
          saved: Number(form.saved || 0),
          deadline: form.deadline || undefined,
        });
      }

      setForm({});

      await loadData();

      alert("Saved successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to save the information."
      );
    }
  };

  /* =========================
     INCOME EDIT
  ========================= */

  const startEditIncome = (item) => {
    setEditingIncome(item._id);

    setForm({
      source: item.source || "",
      amount: item.amount || "",
      category: item.category || "Other",
      date: item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : today,
    });
  };

  const updateIncome = async () => {
    try {
      if (!form.source || !form.amount) {
        alert("Please enter income source and amount.");
        return;
      }

      await api.put(`/income/${editingIncome}`, {
        source: form.source,
        amount: Number(form.amount),
        category: form.category || "Other",
        date: form.date || today,
      });

      setEditingIncome(null);
      setForm({});

      await loadData();

      alert("Income updated successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to update income."
      );
    }
  };

  const cancelEditIncome = () => {
    setEditingIncome(null);
    setForm({});
  };

  /* =========================
     EXPENSE EDIT
  ========================= */

  const startEditExpense = (item) => {
    setEditingExpense(item._id);

    setForm({
      category: item.category || "",
      description: item.description || "",
      amount: item.amount || "",
      date: item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : today,
    });
  };

  const updateExpense = async () => {
    try {
      if (!form.category || !form.amount) {
        alert("Please enter expense category and amount.");
        return;
      }

      await api.put(`/expenses/${editingExpense}`, {
        category: form.category,
        description: form.description || "",
        amount: Number(form.amount),
        date: form.date || today,
      });

      setEditingExpense(null);
      setForm({});

      await loadData();

      alert("Expense updated successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to update expense."
      );
    }
  };

  const cancelEditExpense = () => {
    setEditingExpense(null);
    setForm({});
  };

  /* =========================
     BUDGET EDIT
  ========================= */

  const startEditBudget = (item) => {
    setEditingBudget(item._id);

    setForm({
      category: item.category || "",
      amount: item.amount || "",
      month: item.month || "",
    });
  };

  const updateBudget = async () => {
    try {
      if (!form.category || !form.amount || !form.month) {
        alert("Please fill all budget fields.");
        return;
      }

      await api.put(`/budgets/${editingBudget}`, {
        category: form.category,
        amount: Number(form.amount),
        month: form.month,
      });

      setEditingBudget(null);
      setForm({});

      await loadData();

      alert("Budget updated successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to update budget."
      );
    }
  };

  const cancelEditBudget = () => {
    setEditingBudget(null);
    setForm({});
  };

  /* =========================
     GOAL EDIT
  ========================= */

  const startEditGoal = (goal) => {
    setEditingGoal(goal._id);

    setForm({
      title: goal.title || "",
      target: goal.target || "",
      saved: goal.saved || "",
      deadline: goal.deadline
        ? new Date(goal.deadline).toISOString().split("T")[0]
        : "",
    });
  };

  const updateGoal = async () => {
    try {
      if (!form.title || !form.target) {
        alert("Please enter goal title and target amount.");
        return;
      }

      await api.put(`/goals/${editingGoal}`, {
        title: form.title,
        target: Number(form.target),
        saved: Number(form.saved || 0),
        deadline: form.deadline || undefined,
      });

      setEditingGoal(null);
      setForm({});

      await loadData();

      alert("Goal updated successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to update goal."
      );
    }
  };

  const cancelEditGoal = () => {
    setEditingGoal(null);
    setForm({});
  };

  /* =========================
     DELETE
  ========================= */

  const deleteItem = async (type, id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/${type}/${id}`);

      await loadData();

      alert("Deleted successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to delete this item."
      );
    }
  };

  /* =========================
     EXPENSE FILTER
  ========================= */

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const search = expenseSearch.toLowerCase().trim();

      const matchesSearch =
        !search ||
        expense.category
          ?.toLowerCase()
          .includes(search) ||
        expense.description
          ?.toLowerCase()
          .includes(search);

      const expenseDateValue = expense.date
        ? new Date(expense.date)
            .toISOString()
            .split("T")[0]
        : "";

      const matchesDate =
        !expenseDate ||
        expenseDateValue === expenseDate;

      return matchesSearch && matchesDate;
    });
  }, [expenses, expenseSearch, expenseDate]);

  /* =========================
     BUDGET FILTER
  ========================= */

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const search = budgetSearch.toLowerCase().trim();

      const matchesSearch =
        !search ||
        budget.category
          ?.toLowerCase()
          .includes(search);

      const matchesMonth =
        !budgetMonth ||
        budget.month === budgetMonth;

      return matchesSearch && matchesMonth;
    });
  }, [budgets, budgetSearch, budgetMonth]);

  /* =========================
     GOAL FILTER
  ========================= */

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const search = goalSearch.toLowerCase().trim();

      return (
        !search ||
        goal.title
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [goals, goalSearch]);

  /* =========================
     DASHBOARD CALCULATIONS
  ========================= */

  const categoryData = useMemo(() => {
    const result = {};

    expenses.forEach((expense) => {
      result[expense.category] =
        (result[expense.category] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(result).sort(
      (a, b) => b[1] - a[1]
    );
  }, [expenses]);

  const totalBudget = budgets.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0
  );

  const budgetPercentage =
    totalBudget > 0
      ? Math.min(
          100,
          (Number(dashboard?.totalExpenses || 0) /
            totalBudget) *
            100
        )
      : 0;

  const totalGoalTarget = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.target || 0),
    0
  );

  const totalGoalSaved = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.saved || 0),
    0
  );

  const savingsPercentage =
    totalGoalTarget > 0
      ? Math.min(
          100,
          (totalGoalSaved / totalGoalTarget) *
            100
        )
      : 0;

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (loading || !dashboard) {
    return (
      <div className="loading-page">
        <div className="loader"></div>

        <p>
          Loading your financial dashboard...
        </p>
      </div>
    );
  }

  const menu = [
    {
      id: "dashboard",
      icon: "⌂",
      label: "Dashboard",
    },
    {
      id: "income",
      icon: "↗",
      label: "Income",
    },
    {
      id: "expenses",
      icon: "↘",
      label: "Expenses",
    },
    {
      id: "budgets",
      icon: "◫",
      label: "Budgets",
    },
    {
      id: "goals",
      icon: "★",
      label: "Savings Goals",
    },
  ];

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-icon small">
            ₹
          </div>

          <div>
            <h2>Budget Planner</h2>

            <span>
              Personal Finance
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          {menu.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                tab === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setTab(item.id);

                setEditingIncome(null);
                setEditingExpense(null);
                setEditingBudget(null);
                setEditingGoal(null);

                setForm({});
              }}
            >
              <span>
                {item.icon}
              </span>

              {item.label}
            </button>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <button
            className="logout-btn"
            onClick={logout}
          >
            ⇥ Logout
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}

      <div className="main-area">

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <p className="welcome-small">
              Welcome back
            </p>

            <h2>
              {userName} 👋
            </h2>

          </div>

          <div className="user-avatar">
            {userName
              .charAt(0)
              .toUpperCase()}
          </div>

        </header>

        <main className="content">

          {/* =========================
              DASHBOARD
          ========================= */}

          {tab === "dashboard" && (
            <>
              <PageTitle
                title="Financial Overview"
                subtitle="Here is your current financial summary."
              />

              <div className="stats-grid">

                <div className="stat-card income-card">

                  <div className="stat-icon">
                    ↗
                  </div>

                  <div>
                    <span>
                      Total Income
                    </span>

                    <h2>
                      {money(
                        dashboard.totalIncome
                      )}
                    </h2>
                  </div>

                </div>

                <div className="stat-card expense-card">

                  <div className="stat-icon">
                    ↘
                  </div>

                  <div>
                    <span>
                      Total Expenses
                    </span>

                    <h2>
                      {money(
                        dashboard.totalExpenses
                      )}
                    </h2>
                  </div>

                </div>

                <div className="stat-card balance-card">

                  <div className="stat-icon">
                    ₹
                  </div>

                  <div>
                    <span>
                      Available Balance
                    </span>

                    <h2>
                      {money(
                        dashboard.balance
                      )}
                    </h2>
                  </div>

                </div>

                <div className="stat-card savings-card">

                  <div className="stat-icon">
                    ★
                  </div>

                  <div>
                    <span>
                      Total Saved
                    </span>

                    <h2>
                      {money(
                        dashboard.totalSaved
                      )}
                    </h2>
                  </div>

                </div>

              </div>

              {dashboard.overspending && (
                <div className="warning-box">

                  <strong>
                    ⚠ Budget Alert
                  </strong>

                  <p>
                    Your total expenses have
                    exceeded your current budget.
                  </p>

                </div>
              )}

              <div className="dashboard-grid">

                {/* EXPENSE DISTRIBUTION */}

                <div className="panel">

                  <div className="panel-header">

                    <div>

                      <h3>
                        Expense Distribution
                      </h3>

                      <p>
                        Your spending by category
                      </p>

                    </div>

                  </div>

                  {categoryData.length === 0 ? (

                    <div className="empty-state">

                      <div>
                        📊
                      </div>

                      <p>
                        No expenses recorded yet.
                      </p>

                    </div>

                  ) : (

                    <div className="category-list">

                      {categoryData.map(
                        ([category, amount]) => {

                          const percentage =
                            dashboard.totalExpenses > 0
                              ? (amount /
                                  dashboard.totalExpenses) *
                                100
                              : 0;

                          return (
                            <div
                              className="category-item"
                              key={category}
                            >

                              <div className="category-row">

                                <span>
                                  {category}
                                </span>

                                <strong>
                                  {money(amount)}
                                </strong>

                              </div>

                              <div className="progress-track">

                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                ></div>

                              </div>

                              <small>
                                {percentage.toFixed(1)}%
                                {" "}of total expenses
                              </small>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>

                {/* BUDGET HEALTH */}

                <div className="panel">

                  <div className="panel-header">

                    <div>

                      <h3>
                        Budget Health
                      </h3>

                      <p>
                        Current spending vs budget
                      </p>

                    </div>

                  </div>

                  <div className="big-progress">

                    <div
                      className="circle-progress"
                      style={{
                        background:
                          `conic-gradient(#2563eb ${
                            budgetPercentage * 3.6
                          }deg, #e5e7eb 0deg)`,
                      }}
                    >

                      <div className="circle-inner">

                        <strong>
                          {budgetPercentage.toFixed(0)}%
                        </strong>

                        <span>
                          Used
                        </span>

                      </div>

                    </div>

                  </div>

                  <div className="budget-summary">

                    <div>
                      <span>
                        Budget
                      </span>

                      <strong>
                        {money(totalBudget)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Spent
                      </span>

                      <strong>
                        {money(
                          dashboard.totalExpenses
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Remaining
                      </span>

                      <strong>
                        {money(
                          Math.max(
                            0,
                            totalBudget -
                              dashboard.totalExpenses
                          )
                        )}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

              {/* RECENT TRANSACTIONS */}

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <h3>
                      Recent Transactions
                    </h3>

                    <p>
                      Your latest income and expenses
                    </p>

                  </div>

                </div>

                {income.length === 0 &&
                expenses.length === 0 ? (

                  <div className="empty-state">

                    <div>
                      💳
                    </div>

                    <p>
                      No transactions yet.
                    </p>

                  </div>

                ) : (

                  <div className="transaction-list">

                    {[
                      ...income.map((item) => ({
                        ...item,
                        transactionType:
                          "income",
                      })),

                      ...expenses.map((item) => ({
                        ...item,
                        transactionType:
                          "expense",
                      })),
                    ]
                      .sort(
                        (a, b) =>
                          new Date(b.date) -
                          new Date(a.date)
                      )
                      .slice(0, 6)
                      .map((item) => (

                        <div
                          className="transaction"
                          key={`${item.transactionType}-${item._id}`}
                        >

                          <div
                            className={`transaction-icon ${
                              item.transactionType
                            }`}
                          >
                            {item.transactionType ===
                            "income"
                              ? "↗"
                              : "↘"}
                          </div>

                          <div className="transaction-info">

                            <strong>
                              {item.transactionType ===
                              "income"
                                ? item.source
                                : item.category}
                            </strong>

                            <span>
                              {new Date(
                                item.date
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </span>

                          </div>

                          <strong
                            className={
                              item.transactionType ===
                              "income"
                                ? "amount-positive"
                                : "amount-negative"
                            }
                          >

                            {item.transactionType ===
                            "income"
                              ? "+"
                              : "-"}

                            {money(item.amount)}

                          </strong>

                        </div>
                      ))}

                  </div>
                )}

              </div>
            </>
          )}

          {/* =========================
              INCOME
          ========================= */}

          {tab === "income" && (
            <section>

              <PageTitle
                title="Income Management"
                subtitle="Track all the money coming into your account."
              />

              <div className="management-grid">

                <div className="panel">

                  <h3>
                    {editingIncome
                      ? "Edit Income"
                      : "Add Income"}
                  </h3>

                  <div className="form">

                    <div className="input-group">

                      <label>
                        Income Source
                      </label>

                      <input
                        type="text"
                        placeholder="Salary, Freelance, Gift..."
                        value={form.source || ""}
                        onChange={(e) =>
                          updateForm(
                            "source",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Amount
                      </label>

                      <input
                        type="number"
                        placeholder="Enter amount"
                        min="0"
                        value={form.amount || ""}
                        onChange={(e) =>
                          updateForm(
                            "amount",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Category
                      </label>

                      <select
                        value={
                          form.category ||
                          "Other"
                        }
                        onChange={(e) =>
                          updateForm(
                            "category",
                            e.target.value
                          )
                        }
                      >

                        <option value="Salary">
                          Salary
                        </option>

                        <option value="Freelance">
                          Freelance
                        </option>

                        <option value="Business">
                          Business
                        </option>

                        <option value="Scholarship">
                          Scholarship
                        </option>

                        <option value="Gift">
                          Gift
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="input-group">

                      <label>
                        Date
                      </label>

                      <input
                        type="date"
                        value={
                          form.date || today
                        }
                        onChange={(e) =>
                          updateForm(
                            "date",
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  {editingIncome ? (

                    <div>

                      <button
                        className="primary-btn"
                        onClick={updateIncome}
                      >
                        Save Changes
                      </button>

                      <button
                        className="delete-btn"
                        onClick={
                          cancelEditIncome
                        }
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <button
                      className="primary-btn"
                      onClick={() =>
                        add("income")
                      }
                    >
                      + Add Income
                    </button>

                  )}

                </div>

                <div className="panel">

                  <h3>
                    Income Records
                  </h3>

                  {income.length === 0 ? (

                    <p className="muted">
                      No income records yet.
                    </p>

                  ) : (

                    <div className="record-list">

                      {income.map((item) => (

                        <div
                          className="record"
                          key={item._id}
                        >

                          <div>

                            <strong>
                              {item.source}
                            </strong>

                            <span>
                              {item.category ||
                                "Other"}
                            </span>

                            <span>
                              {new Date(
                                item.date
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </span>

                          </div>

                          <div className="record-right">

                            <strong className="amount-positive">
                              +{money(item.amount)}
                            </strong>

                            <button
                              className="primary-btn"
                              onClick={() =>
                                startEditIncome(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                deleteItem(
                                  "income",
                                  item._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              </div>

            </section>
          )}

          {/* =========================
              EXPENSES
          ========================= */}

          {tab === "expenses" && (
            <section>

              <PageTitle
                title="Expense Management"
                subtitle="Track and control where your money goes."
              />

              <div className="management-grid">

                <div className="panel">

                  <h3>
                    {editingExpense
                      ? "Edit Expense"
                      : "Add Expense"}
                  </h3>

                  <div className="form">

                    <div className="input-group">

                      <label>
                        Category
                      </label>

                      <select
                        value={
                          form.category || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "category",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select category
                        </option>

                        <option value="Food">
                          Food
                        </option>

                        <option value="Transport">
                          Transport
                        </option>

                        <option value="Education">
                          Education
                        </option>

                        <option value="Shopping">
                          Shopping
                        </option>

                        <option value="Bills">
                          Bills
                        </option>

                        <option value="Entertainment">
                          Entertainment
                        </option>

                        <option value="Health">
                          Health
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="input-group">

                      <label>
                        Description
                      </label>

                      <input
                        type="text"
                        placeholder="Example: Lunch, Bus ticket..."
                        value={
                          form.description ||
                          ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "description",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Amount
                      </label>

                      <input
                        type="number"
                        placeholder="Enter amount"
                        min="0"
                        value={
                          form.amount || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "amount",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Date
                      </label>

                      <input
                        type="date"
                        value={
                          form.date || today
                        }
                        onChange={(e) =>
                          updateForm(
                            "date",
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  {editingExpense ? (

                    <div>

                      <button
                        className="primary-btn"
                        onClick={
                          updateExpense
                        }
                      >
                        Save Changes
                      </button>

                      <button
                        className="delete-btn"
                        onClick={
                          cancelEditExpense
                        }
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <button
                      className="primary-btn"
                      onClick={() =>
                        add("expenses")
                      }
                    >
                      + Add Expense
                    </button>

                  )}

                </div>

                <div className="panel">

                  <div className="panel-header">

                    <div>

                      <h3>
                        Expense Records
                      </h3>

                      <p>
                        Search and filter your expenses.
                      </p>

                    </div>

                  </div>

                  <div className="expense-filters">

                    <div className="input-group">

                      <label>
                        Search Expense
                      </label>

                      <input
                        type="text"
                        placeholder="Search category or description..."
                        value={expenseSearch}
                        onChange={(e) =>
                          setExpenseSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Filter by Date
                      </label>

                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) =>
                          setExpenseDate(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <button
                      className="delete-btn"
                      onClick={() => {
                        setExpenseSearch("");
                        setExpenseDate("");
                      }}
                    >
                      Clear Filters
                    </button>

                  </div>

                  {filteredExpenses.length === 0 ? (

                    <div className="empty-state">

                      <div>
                        🔍
                      </div>

                      <p>
                        No matching expenses found.
                      </p>

                    </div>

                  ) : (

                    <div className="record-list">

                      {filteredExpenses.map(
                        (item) => (

                          <div
                            className="record"
                            key={item._id}
                          >

                            <div>

                              <strong>
                                {item.category}
                              </strong>

                              <span>
                                {item.description ||
                                  "No description"}
                              </span>

                              <span>
                                {new Date(
                                  item.date
                                ).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>

                            </div>

                            <div className="record-right">

                              <strong className="amount-negative">
                                -{money(item.amount)}
                              </strong>

                              <button
                                className="primary-btn"
                                onClick={() =>
                                  startEditExpense(
                                    item
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteItem(
                                    "expenses",
                                    item._id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

            </section>
          )}

          {/* =========================
              BUDGETS
          ========================= */}

          {tab === "budgets" && (
            <section>

              <PageTitle
                title="Budget Management"
                subtitle="Create spending limits and monitor your budget."
              />

              <div className="management-grid">

                <div className="panel">

                  <h3>
                    {editingBudget
                      ? "Edit Budget"
                      : "Set Budget"}
                  </h3>

                  <div className="form">

                    <div className="input-group">

                      <label>
                        Category
                      </label>

                      <select
                        value={
                          form.category || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "category",
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select category
                        </option>

                        <option value="Food">
                          Food
                        </option>

                        <option value="Transport">
                          Transport
                        </option>

                        <option value="Education">
                          Education
                        </option>

                        <option value="Shopping">
                          Shopping
                        </option>

                        <option value="Bills">
                          Bills
                        </option>

                        <option value="Entertainment">
                          Entertainment
                        </option>

                        <option value="Health">
                          Health
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                    <div className="input-group">

                      <label>
                        Monthly Budget
                      </label>

                      <input
                        type="number"
                        placeholder="Enter budget amount"
                        min="0"
                        value={
                          form.amount || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "amount",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Month
                      </label>

                      <input
                        type="month"
                        value={
                          form.month || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "month",
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  {editingBudget ? (

                    <div>

                      <button
                        className="primary-btn"
                        onClick={
                          updateBudget
                        }
                      >
                        Save Changes
                      </button>

                      <button
                        className="delete-btn"
                        onClick={
                          cancelEditBudget
                        }
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <button
                      className="primary-btn"
                      onClick={() =>
                        add("budgets")
                      }
                    >
                      + Set Budget
                    </button>

                  )}

                </div>

                <div className="panel">

                  <div className="panel-header">

                    <div>

                      <h3>
                        Budget Records
                      </h3>

                      <p>
                        Search and filter your budgets.
                      </p>

                    </div>

                  </div>

                  <div className="expense-filters">

                    <div className="input-group">

                      <label>
                        Search Budget
                      </label>

                      <input
                        type="text"
                        placeholder="Search category..."
                        value={budgetSearch}
                        onChange={(e) =>
                          setBudgetSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Filter by Month
                      </label>

                      <input
                        type="month"
                        value={budgetMonth}
                        onChange={(e) =>
                          setBudgetMonth(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <button
                      className="delete-btn"
                      onClick={() => {
                        setBudgetSearch("");
                        setBudgetMonth("");
                      }}
                    >
                      Clear Filters
                    </button>

                  </div>

                  {filteredBudgets.length === 0 ? (

                    <div className="empty-state">

                      <div>
                        🔍
                      </div>

                      <p>
                        No matching budgets found.
                      </p>

                    </div>

                  ) : (

                    <div className="record-list">

                      {filteredBudgets.map(
                        (item) => (

                          <div
                            className="record"
                            key={item._id}
                          >

                            <div>

                              <strong>
                                {item.category}
                              </strong>

                              <span>
                                {item.month}
                              </span>

                            </div>

                            <div className="record-right">

                              <strong>
                                {money(item.amount)}
                              </strong>

                              <button
                                className="primary-btn"
                                onClick={() =>
                                  startEditBudget(
                                    item
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteItem(
                                    "budgets",
                                    item._id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

            </section>
          )}

          {/* =========================
              SAVINGS GOALS
          ========================= */}

          {tab === "goals" && (
            <section>

              <PageTitle
                title="Savings Goals"
                subtitle="Set targets and track your progress."
              />

              {/* GOAL OVERVIEW */}

              <div className="panel goal-overview">

                <div>

                  <span>
                    Total Goal Progress
                  </span>

                  <h2>
                    {money(totalGoalSaved)}
                    {" / "}
                    {money(totalGoalTarget)}
                  </h2>

                </div>

                <div className="goal-progress">

                  <div
                    style={{
                      width:
                        `${savingsPercentage}%`,
                    }}
                  ></div>

                </div>

              </div>

              <div className="management-grid">

                {/* GOAL FORM */}

                <div className="panel">

                  <h3>
                    {editingGoal
                      ? "Edit Savings Goal"
                      : "Add Savings Goal"}
                  </h3>

                  <div className="form">

                    <div className="input-group">

                      <label>
                        Goal Title
                      </label>

                      <input
                        type="text"
                        placeholder="Example: New Laptop"
                        value={
                          form.title || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "title",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Target Amount
                      </label>

                      <input
                        type="number"
                        placeholder="Enter target amount"
                        min="0"
                        value={
                          form.target || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "target",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Already Saved
                      </label>

                      <input
                        type="number"
                        placeholder="Enter saved amount"
                        min="0"
                        value={
                          form.saved || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "saved",
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Deadline
                      </label>

                      <input
                        type="date"
                        value={
                          form.deadline || ""
                        }
                        onChange={(e) =>
                          updateForm(
                            "deadline",
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                  {editingGoal ? (

                    <div>

                      <button
                        className="primary-btn"
                        onClick={updateGoal}
                      >
                        Save Changes
                      </button>

                      <button
                        className="delete-btn"
                        onClick={cancelEditGoal}
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        Cancel
                      </button>

                    </div>

                  ) : (

                    <button
                      className="primary-btn"
                      onClick={() =>
                        add("goals")
                      }
                    >
                      + Add Goal
                    </button>

                  )}

                </div>

                {/* GOAL RECORDS */}

                <div className="panel">

                  <div className="panel-header">

                    <div>

                      <h3>
                        Your Goals
                      </h3>

                      <p>
                        Search and track your savings goals.
                      </p>

                    </div>

                  </div>

                  {/* GOAL SEARCH */}

                  <div className="expense-filters">

                    <div className="input-group">

                      <label>
                        Search Goal
                      </label>

                      <input
                        type="text"
                        placeholder="Search goal title..."
                        value={goalSearch}
                        onChange={(e) =>
                          setGoalSearch(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        setGoalSearch("")
                      }
                    >
                      Clear Search
                    </button>

                  </div>

                  {filteredGoals.length === 0 ? (

                    <div className="empty-state">

                      <div>
                        🔍
                      </div>

                      <p>
                        No matching savings goals found.
                      </p>

                    </div>

                  ) : (

                    <div className="goal-list">

                      {filteredGoals.map((goal) => {

                        const progress =
                          goal.target > 0
                            ? Math.min(
                                100,
                                (Number(goal.saved || 0) /
                                  Number(goal.target || 0)) *
                                  100
                              )
                            : 0;

                        return (

                          <div
                            className="goal-item"
                            key={goal._id}
                          >

                            <div className="goal-header">

                              <strong>
                                {goal.title}
                              </strong>

                              <span>
                                {progress.toFixed(0)}%
                              </span>

                            </div>

                            <div className="progress-track">

                              <div
                                className="progress-fill goal-fill"
                                style={{
                                  width:
                                    `${progress}%`,
                                }}
                              ></div>

                            </div>

                            <div className="goal-footer">

                              <span>
                                {money(
                                  goal.saved
                                )}{" "}
                                saved
                              </span>

                              <span>
                                Target{" "}
                                {money(
                                  goal.target
                                )}
                              </span>

                            </div>

                            {goal.deadline && (

                              <span className="muted">
                                Deadline:{" "}
                                {new Date(
                                  goal.deadline
                                ).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>

                            )}

                            <div
                              style={{
                                marginTop: "12px",
                              }}
                            >

                              <button
                                className="primary-btn"
                                onClick={() =>
                                  startEditGoal(
                                    goal
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteItem(
                                    "goals",
                                    goal._id
                                  )
                                }
                                style={{
                                  marginLeft: "10px",
                                }}
                              >
                                Delete
                              </button>

                            </div>

                          </div>

                        );
                      })}

                    </div>

                  )}

                </div>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  );
}

/* =========================
   PAGE TITLE
========================= */

function PageTitle({ title, subtitle }) {
  return (
    <div className="page-heading">

      <div>

        <h1>
          {title}
        </h1>

        <p>
          {subtitle}
        </p>

      </div>

    </div>
  );
}

/* =========================
   APP
========================= */

export default function App() {
  const [logged, setLogged] = useState(
    !!localStorage.getItem("token")
  );

  return logged ? (
    <Dashboard />
  ) : (
    <Auth
      onLogin={() =>
        setLogged(true)
      }
    />
  );
}