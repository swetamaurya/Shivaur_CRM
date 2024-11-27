
const Attendance = require("../model/attendanceModel");
 const { User  } = require("../model/userModel");
const { Project } = require("../model/projectModel");
const { Product, Category } = require("../model/productModel");
const Task = require("../model/taskModel");
const Policy = require("../model/policyModel");
const { Invoice, Estimate } = require("../model/invoiceModel");
const { Department, Designation } = require("../model/departmentModel");
 const { Leaves, Holiday ,LeaveType} = require("../model/holidayModel");
 const  Expenses   = require('../model/expensesModel');
 const { Termination, Resignation } = require("../model/performationsModel");

 
const models = {
    attendance: Attendance,
    user: User,
    project: Project,
    product: Product,
    category: Category,
    task: Task,
    policy: Policy,
    invoice: Invoice,
    estimate: Estimate,
    department: Department,
    designation: Designation,
    leaves: Leaves,
    holiday: Holiday,
    leaveType: LeaveType,
    expense: Expenses,
    termination: Termination,
    resignation: Resignation,
  };
  
<<<<<<< HEAD
   
  // Population configuration for all models
const populationConfig = {
  Task: [
    { path: 'clientName' },
    { path: 'assignedTo' },
    { path: 'project' },
    { path: 'assignedBy' },
  ],
  Project: [
    { path: 'clientName' },
    { path: 'assignedTo' },
    { path: 'tasks' },
  ],
  User: [
    { path: 'assigned' },
    { path: 'clientName' },
    { path: 'leave' },
    { path: 'attendance' },
    { path: 'Manager' },
    { path: 'Supervisor' },
    { path: 'departments' , select: 'departments'},
    { path: 'designations', select: 'designations' },
  ],
  Expenses: [
    { path: 'purchaseBy' },
  ],
  Leaves: [
    { path: 'leaveType' },
    { path: 'employee' },
    { path: 'approvedBy' },
  ],
  Invoice: [
    { path: 'client' },
    { path: 'project' },
  ],
  Estimates: [
    { path: 'client' },
    { path: 'project' },
  ],
  Resignation: [
    { path: 'employee' },
  ],
  Termination: [
    { path: 'employee' },
  ],
  Policy: [
    { path: 'department' },
  ],
  Product: [
    { path: 'category' },
  ],
  Attendance: [
    { path: 'employee', select: 'name email' },
    { path: 'approvedBy', select: 'name email' },
  ],
};

// Function to get population rules dynamically
const getModelByName = (modelName) => {
  if (!modelName || typeof modelName !== "string") {
    console.error("Invalid model name provided:", modelName);
    return null;
  }

  const lowerCaseModelName = modelName.toLowerCase();
  return models[lowerCaseModelName] || null;
};
const getPopulationRules = (modelName) => populationConfig[modelName.toLowerCase()] || [];

  // Export both models and the function
  module.exports = {
    getPopulationRules,
=======
  const getModelByName = (modelName) => models[modelName.toLowerCase()] || null;
  
  // Export both models and the function
  module.exports = {
 
>>>>>>> 3b70b594ca05c177dc1c42b0908a69db9e73870f
    getModelByName
  };
  