import express from "express";
import Expense from "../models/Expense.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all expenses for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const data = await Expense.find({
      user: req.user.id,
    }).sort({ date: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
    });
  }
});

// Add new expense
router.post("/", auth, async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;

    if (!category || amount === undefined) {
      return res.status(400).json({
        message: "Category and amount are required",
      });
    }

    const item = await Expense.create({
      user: req.user.id,
      category,
      description: description || "",
      amount,
      date: date || new Date(),
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Update expense
router.put("/:id", auth, async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;

    const updatedExpense = await Expense.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        category,
        description: description || "",
        amount,
        date,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete expense
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedExpense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
    });
  }
});

export default router;