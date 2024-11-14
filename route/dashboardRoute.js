const express = require("express");
const route = express.Router();
const Attendance = require("../model/attendanceModel");
const { auth } = require("../Middleware/authorization");
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
      { name: 'Termination', model: Termination },
      { name: 'Resignation', model: Resignation },
      { name: 'Leaves', model: Leaves },
      { name: 'LeaveType', model: LeaveType },
      { name: 'Task', model: Task },
      { name: 'Project', model: Project },
      { name: 'Product', model: Product },
      { name: 'Category', model: Category },
      { name: 'Attendance', model: Attendance },
      { name: 'Policy', model: Policy },
      { name: 'Invoice', model: Invoice },
      { name: 'Department', model: Department },
      { name: 'Designation', model: Designation },
     
      { name: 'Holiday', model: Holiday },
      { name: 'Estimate', model: Estimate },
   
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
  
      { name: 'Termination', model: Termination },
      { name: 'Resignation', model: Resignation },
      { name: 'Leaves', model: Leaves },
      { name: 'LeaveType', model: LeaveType },
      { name: 'Task', model: Task },
      { name: 'Project', model: Project },
      { name: 'Product', model: Product },
      { name: 'Category', model: Category },
      { name: 'Attendance', model: Attendance },
      { name: 'Policy', model: Policy },
      { name: 'Invoice', model: Invoice },
      { name: 'Department', model: Department },
      { name: 'Designation', model: Designation },
     
      { name: 'Holiday', model: Holiday },
      { name: 'Estimate', model: Estimate },
    
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

const generateExcelFile = async (res, data) => {
  const workbook = new ExcelJS.Workbook();

   const getDepartmentNames = async (ids) => {
    const departments = await Department.find({ _id: { $in: ids } });
    return departments.reduce((map, dept) => {
      map[dept._id] = dept.departments; // Assuming `name` is the field for department names
      return map;
    }, {});
  };

  const getDesignationNames = async (ids) => {
    const designations = await Designation.find({ _id: { $in: ids } });
    return designations.reduce((map, desig) => {
      map[desig._id] = desig.designations; // Assuming `name` is the field for designation names
      return map;
    }, {});
  };

  for (const [modelName, modelData] of Object.entries(data)) {
    const worksheet = workbook.addWorksheet(modelName);

    // Gather all department and designation IDs in this model's data
    const departmentIds = new Set();
    const designationIds = new Set();

    modelData.forEach((item) => {
      if (item.departments) departmentIds.add(item.departments);
      if (item.designations) designationIds.add(item.designations);
    });

    // Fetch names for departments and designations
    const departmentNames = await getDepartmentNames([...departmentIds]);
    const designationNames = await getDesignationNames([...designationIds]);

    // Flatten and exclude specific fields in each entry
    const flattenData = (entry) => {
      const flatObject = {};
      for (const [key, value] of Object.entries(entry)) {
        if (["_id", "password", "image", "document", "__v"].includes(key)) {
          continue; // Skip these fields
        }

        if (key === "departments") {
          // Replace department ID with name or leave blank if no name found
          flatObject[key] = departmentNames[value] || "";
        } else if (key === "designations") {
          // Replace designation ID with name or leave blank if no name found
          flatObject[key] = designationNames[value] || "";
        } else if (typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            // Replace empty arrays with blank and join non-empty arrays as a string
            flatObject[key] = value.length === 0 ? "" : value.join(", ");
          } else {
            // Flatten nested objects
            for (const [nestedKey, nestedValue] of Object.entries(value)) {
              flatObject[`${key}_${nestedKey}`] = nestedValue;
            }
          }
        } else {
          flatObject[key] = value;
        }
      }
      return flatObject;
    };

    // Flatten all data entries and apply the necessary transformations
    const flatData = modelData.map((item) => flattenData(item.toObject()));

    // Set up worksheet columns dynamically based on keys of flattened data
    worksheet.columns = Object.keys(flatData[0]).map((key) => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      key: key,
      width: 20,
    }));

    // Add each flattened item as a row in the worksheet
    flatData.forEach((item) => worksheet.addRow(item));

    // Optionally, add a row with the total count of records at the end
    worksheet.addRow({});
    worksheet.addRow({ Total_Records: flatData.length });
  }

  // Set headers and send the file as a response
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="exported-data.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
};





module.exports = route;
