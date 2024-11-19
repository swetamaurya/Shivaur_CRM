
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
  
  const getModelByName = (modelName) => models[modelName.toLowerCase()] || null;
  
  // Export both models and the function
  module.exports = {
 
    getModelByName
  };
  