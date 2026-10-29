import express from "express";
import auth from "../middleware/auth.js";

import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import Budget from "../models/Budget.js";
import Goal from "../models/Goal.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const [income, expenses, budgets, goals] =
      await Promise.all([
        Income.find({ user: req.user.id }),
        Expense.find({ user: req.user.id }),
        Budget.find({ user: req.user.id }),
        Goal.find({ user: req.user.id }),
      ]);

    /* =========================
       TOTAL CALCULATIONS
    ========================= */

    const totalIncome = income.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalExpenses = expenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalBudget = budgets.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalSaved = goals.reduce(
      (sum, item) =>
        sum + Number(item.saved || 0),
      0
    );

    /* =========================
       BALANCE
    ========================= */

    const balance =
      totalIncome - totalExpenses;

    /* =========================
       EXPENSE CATEGORIES
    ========================= */

    const categories = {};

    expenses.forEach((expense) => {
      const category =
        expense.category || "Other";

      categories[category] =
        (categories[category] || 0) +
        Number(expense.amount || 0);
    });

    /* =========================
       MONTHLY ANALYTICS
    ========================= */

    const monthlyData = {};

    income.forEach((item) => {
      const month = new Date(item.date)
        .toISOString()
        .slice(0, 7);

      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          expenses: 0,
        };
      }

      monthlyData[month].income +=
        Number(item.amount || 0);
    });

    expenses.forEach((item) => {
      const month = new Date(item.date)
        .toISOString()
        .slice(0, 7);

      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          expenses: 0,
        };
      }

      monthlyData[month].expenses +=
        Number(item.amount || 0);
    });

    const monthlySummary = Object.entries(
      monthlyData
    )
      .sort((a, b) =>
        a[0].localeCompare(b[0])
      )
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance:
          data.income - data.expenses,
      }));

    /* =========================
       BUDGET STATUS
    ========================= */

    const budgetUsedPercentage =
      totalBudget > 0
        ? Math.min(
            100,
            (totalExpenses / totalBudget) *
              100
          )
        : 0;

    const remainingBudget =
      Math.max(
        0,
        totalBudget - totalExpenses
      );

    const overspending =
      totalBudget > 0 &&
      totalExpenses > totalBudget;

    /* =========================
       GOAL PROGRESS
    ========================= */

    const totalGoalTarget =
      goals.reduce(
        (sum, goal) =>
          sum + Number(goal.target || 0),
        0
      );

    const savingsPercentage =
      totalGoalTarget > 0
        ? Math.min(
            100,
            (totalSaved / totalGoalTarget) *
              100
          )
        : 0;

    /* =========================
       RESPONSE
    ========================= */

    res.json({
      totalIncome,
      totalExpenses,
      balance,

      totalBudget,
      remainingBudget,
      budgetUsedPercentage,
      overspending,

      totalSaved,
      totalGoalTarget,
      savingsPercentage,

      categories,
      monthlySummary,
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load dashboard data",
    });
  }
});

export default router;