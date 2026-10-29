import express from "express";
import Income from "../models/Income.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all income for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const data = await Income.find({
      user: req.user.id,
    }).sort({ date: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch income",
    });
  }
});

// Add new income
router.post("/", auth, async (req, res) => {
  try {
    const { source, amount, category, date } = req.body;

    if (!source || amount === undefined) {
      return res.status(400).json({
        message: "Source and amount are required",
      });
    }

    const item = await Income.create({
      user: req.user.id,
      source,
      amount,
      category: category || "Other",
      date: date || new Date(),
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Update income
router.put("/:id", auth, async (req, res) => {
  try {
    const { source, amount, category, date } = req.body;

    const updatedIncome = await Income.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        source,
        amount,
        category: category || "Other",
        date,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedIncome) {
      return res.status(404).json({
        message: "Income not found",
      });
    }

    res.json(updatedIncome);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete income
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedIncome = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deletedIncome) {
      return res.status(404).json({
        message: "Income not found",
      });
    }

    res.json({
      message: "Income deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete income",
    });
  }
});

export default router;