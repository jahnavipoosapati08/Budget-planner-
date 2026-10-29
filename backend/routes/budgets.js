import express from "express";
import Budget from "../models/Budget.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all budgets for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const data = await Budget.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budgets",
    });
  }
});

// Add new budget
router.post("/", auth, async (req, res) => {
  try {
    const { category, amount, month } = req.body;

    if (!category || amount === undefined || !month) {
      return res.status(400).json({
        message: "Category, amount and month are required",
      });
    }

    const item = await Budget.create({
      user: req.user.id,
      category,
      amount,
      month,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Update budget
router.put("/:id", auth, async (req, res) => {
  try {
    const { category, amount, month } = req.body;

    const updatedBudget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        category,
        amount,
        month,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBudget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json(updatedBudget);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete budget
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedBudget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedBudget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.json({
      message: "Budget deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete budget",
    });
  }
});

export default router;