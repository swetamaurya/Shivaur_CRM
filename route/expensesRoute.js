const express = require('express');
const router = express.Router();
const  Expenses   = require('../model/expensesModel');
const { auth } = require('../Middleware/authorization');
const multer = require("multer");
const { uploadFileToFirebase } = require('../utils/fireBase');
const upload = multer({ storage: multer.memoryStorage() });

 
// Route to create a new expense
router.post("/expenses/post", auth, upload.array('file'), async (req, res) => {
  try {
    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      const newFileUrls = await uploadFileToFirebase(req.files);
      fileUrls = [...fileUrls, ...newFileUrls];
    }

    const newExpenses = new Expenses({
      ...req.body,
      files: fileUrls,
      userId: req.user._id, // Associate expense with the logged-in user
    });

    const savedExpenses = await newExpenses.save();
    res.status(200).send({ message: 'Expenses created successfully', Expenses: savedExpenses });
  } catch (error) {
    console.error('Error adding files to Expenses:', error);
    return res.status(500).send({ message: `Internal server error: ${error.message}` });
  }
});

// Route to get all expenses - Admins get all expenses, non-admins only get their own
router.get('/expenses/get', auth, async (req, res) => {
  try {
    const { roles, _id: userId } = req.user;
    const query = roles === 'Admin' ? {} : { userId };

    const expenses = await Expenses.find(query);
    res.status(200).json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

// Route to update an expense - Admins can update any, others only their own
router.post('/expenses/update', auth, upload.array('file'), async (req, res) => {
  try {
    const { roles, _id: userId } = req.user;
    const { _id, ...updateData } = req.body;

    let fileUrls = [];
    if (req.files && req.files.length > 0) {
      const newFileUrls = await uploadFileToFirebase(req.files);
      fileUrls = [...fileUrls, ...newFileUrls];
    }

    const expense = await Expenses.findById(_id);
    if (!expense) {
      return res.status(404).send("Expense not found.");
    }

    if (roles !== 'Admin' && expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to update this expense.' });
    }

    const updateFields = {
      ...updateData,
      files: fileUrls.length > 0 ? [...expense.files, ...fileUrls] : expense.files
    };

    const updatedExpense = await Expenses.findByIdAndUpdate(_id, updateFields, { new: true });
    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error(`Error updating expense: ${error.message}`);
    return res.status(500).send("Internal server error");
  }
});

// Route to delete an expense - Admins can delete any, others only their own
router.post('/expenses/delete', auth, async (req, res) => {
  try {
    const { roles, _id: userId } = req.user;
    const { _id } = req.body;

    const expense = await Expenses.findById(_id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (roles !== 'Admin' && expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: Unauthorized to delete this expense.' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: 'Error deleting expense' });
  }
});

module.exports = router;

 