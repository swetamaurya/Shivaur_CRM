const express = require("express");
const route = express.Router();
const Attendance = require("../model/attendanceModel");
const { auth } = require("../Middleware/authorization");
const { User, Asset } = require("../model/userModel");
const { Project } = require("../model/projectModel");
const { Product, Category } = require("../model/productModel");
const Task = require("../model/taskModel");
const Policy = require("../model/policyModel");
const { Invoice, Estimate } = require("../model/invoiceModel");
const { Department, Designation } = require("../model/departmentModel");
const Event = require("../model/eventModel");
const { Leaves, Holiday } = require("../model/holidayModel");
// const payrollModel = require("../model/payrollModel");
const { Payment, Expenses } = require("../model/paymentModel");
const { Termination, Resignation } = require("../model/performationsModel");
 const ExcelJS = require("exceljs")


route.post("/delete/all", auth, async (req, res) => {
  try {
    const { _id } = req.body;

    // Validate _id input
    if (!_id || (Array.isArray(_id) && _id.length === 0)) {
      return res.status(400).send("No _id provided for deletion.");
    }

    const _idArray = Array.isArray(_id) ? _id : [_id];

    // Array of models to check for deletion
    const models = [
      { name: 'User', model: User },
      { name: 'Asset', model: Asset },
      { name: 'Termination', model: Termination },
      { name: 'Resignation', model: Resignation },
      { name: 'Leaves', model: Leaves },
      { name: 'Task', model: Task },
      { name: 'Project', model: Project },
      { name: 'Product', model: Product },
      { name: 'Category', model: Category },
      { name: 'Attendance', model: Attendance },
      { name: 'Policy', model: Policy },
      { name: 'Invoice', model: Invoice },
      { name: 'Department', model: Department },
      { name: 'Designation', model: Designation },
      { name: 'Event', model: Event },
      { name: 'Holiday', model: Holiday },
      { name: 'Estimate', model: Estimate },
      { name: 'Payment', model: Payment },
      { name: 'Expenses', model: Expenses }
    ];

    let totalDeletedCount = 0;
    const deletionResults = [];

    // Loop through each model and attempt deletion
    for (const { name, model } of models) {
      const deletionResult = await model.deleteMany({ _id: { $in: _idArray } });
      if (deletionResult.deletedCount > 0) {
        totalDeletedCount += deletionResult.deletedCount;
        deletionResults.push({ model: name, deletedCount: deletionResult.deletedCount });
      }
    }

    // Check if any records were deleted
    if (totalDeletedCount === 0) {
      return res.status(404).send("No records found for the provided ID(s) in any model.");
    }

    // Return summary of deletion results
    return res.status(200).send({
      message: `${totalDeletedCount} records deleted successfully across models.`,
      deletionResults
    });

  } catch (error) {
    console.error("Error deleting records:", error);
    return res.status(500).send(`Internal server error: ${error.message}`);
  }
});

 
// Route to export data
route.post("/export", auth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { roles } = req.user;
  const {_id} = req.body
  try {
    if (!_id || (Array.isArray(_id) && _id.length === 0)) {
      return res.status(400).json({ error: "No _id provided for export." });
    }

    const _idArray = Array.isArray(_id) ? _id : [_id];

    const models = [
      { name: 'User', model: User },
      { name: 'Asset', model: Asset },
      { name: 'Termination', model: Termination },
      { name: 'Resignation', model: Resignation },
      { name: 'Leaves', model: Leaves },
      { name: 'Task', model: Task },
      { name: 'Project', model: Project },
      { name: 'Product', model: Product },
      { name: 'Category', model: Category },
      { name: 'Attendance', model: Attendance },
      { name: 'Policy', model: Policy },
      { name: 'Invoice', model: Invoice },
      { name: 'Department', model: Department },
      { name: 'Designation', model: Designation },
      { name: 'Event', model: Event },
      { name: 'Holiday', model: Holiday },
      { name: 'Estimate', model: Estimate },
      { name: 'Payment', model: Payment },
      { name: 'Expenses', model: Expenses }
    ];

    const skip = (page - 1) * limit;
    const totalData = {};

    for (const { name, model } of models) {
      const data = await model.find({ _id: { $in: _idArray } })
                              .skip(skip)
                              .limit(parseInt(limit));
      if (data.length > 0) {
        totalData[name] = data;
      }
    }

    if (Object.keys(totalData).length === 0) {
      return res.status(404).json({ message: "No records found for the provided ID(s) across models." });
    }

    return generateExcelFile(res, totalData);

  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Function to generate and send Excel file with dynamic headers for each model
const generateExcelFile = async (res, data) => {
  const workbook = new ExcelJS.Workbook();

  // Define headers for each model
  const headersByModel = {
    User: [
      { header: 'ID', key: '_id', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'roles', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ],
    Project: [
      { header: 'ID', key: '_id', width: 20 },
      { header: 'Project Name', key: 'projectName', width: 30 },
      { header: 'Client', key: 'client', width: 30 },
      { header: 'Start Date', key: 'startDate', width: 20 },
      { header: 'End Date', key: 'endDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 }
    ],
    // Add headers for other models similarly...
  };

  // Create sheets for each model with relevant headers
  for (const [modelName, modelData] of Object.entries(data)) {
    const worksheet = workbook.addWorksheet(modelName);
    const headers = headersByModel[modelName] || [{ header: 'ID', key: '_id', width: 20 }];
    worksheet.columns = headers;

    // Add data to each worksheet
    modelData.forEach(item => {
      const rowData = headers.reduce((acc, header) => {
        acc[header.key] = item[header.key] || '';
        return acc;
      }, {});
      worksheet.addRow(rowData);
    });

    // Optionally, add total count row at the bottom of each sheet
    worksheet.addRow({});
    worksheet.addRow({ _id: '', name: 'Total Records:', email: modelData.length });
  }

  // Set headers for file download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="exported-data.xlsx"');

  // Write workbook to response stream
  await workbook.xlsx.write(res);
  res.end();
};















route.get("/dashboard", auth, async (req, res) => {
  try {
    // Fetch counts for projects, clients, tasks, and employees
    const projectsCount = await Project.countDocuments();
    const clientsCount = await User.countDocuments({ roles: "Client" });
    const tasksCount = await Task.countDocuments();
    const employeesCount = await User.countDocuments({ roles: "Employee" });

    // Fetch counts for invoices and estimates, and calculate total payments count
    const invoicesCount = await Invoice.countDocuments();
    const estimatesCount = await Estimate.countDocuments();
    const paymentsCount = invoicesCount + estimatesCount; // Total count of payments (invoices + estimates)

    // Calculate total earnings based on invoices and payments data
    const invoiceEarnings = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$GrandTotal" } } // Convert GrandTotal string to double
        }
      }
    ]);
    const estimateEarnings = await Estimate.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$GrandTotal" } } // Convert GrandTotal string to double
        }
      }
    ]);
    const earnings = (invoiceEarnings[0]?.total || 0) + (estimateEarnings[0]?.total || 0);

    // Calculate total expenses
    const expensesData = await Expenses.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } } // Convert amount string to double
        }
      }
    ]);
    const expenses = expensesData[0]?.total || 0;

    // Calculate profit
    const profit = earnings - expenses;

    // Fetch latest invoices and payments
    const invoices = await Invoice.find().sort({ dueDate: -1 }).limit(5);
    const payments = await Payment.find().sort({ paidDate: -1 }).limit(5);

    // Fetch a list of clients with their statuses
    const clients = await User.find({ roles: "Client" }, "name status").limit(5);

    // Fetch a list of projects with their task associations
    const projects = await Project.find({}, "projectName task").limit(5);

    // Send response with aggregated dashboard data
    return res.status(200).json({
      summary: {
        projectsCount,
        clientsCount,
        tasksCount,
        employeesCount,
        paymentsCount, // Total payments count (invoices + estimates)
      },
      financials: {
        earnings,
        expenses,
        profit,
      },
      invoices,
      payments,
      clients,
      projects,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).send("Internal server error.");
  }
});




module.exports = route;
