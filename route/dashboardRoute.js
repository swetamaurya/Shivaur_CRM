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
 const { getModelByName } = require('../model/globalModel');

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
  const { _id } = req.body;

  try {
    if (!_id || (Array.isArray(_id) && _id.length === 0)) {
      return res.status(400).json({ error: "No _id provided for export." });
    }

    const _idArray = Array.isArray(_id) ? _id : [_id];

    const models = [
      { name: "User", model: User },
      { name: "Termination", model: Termination },
      { name: "Resignation", model: Resignation },
      { name: "Leaves", model: Leaves },
      { name: "LeaveType", model: LeaveType },
      { name: "Task", model: Task },
      { name: "Project", model: Project },
      { name: "Product", model: Product },
      { name: "Category", model: Category },
      { name: "Attendance", model: Attendance },
      { name: "Policy", model: Policy },
      { name: "Invoice", model: Invoice },
      { name: "Department", model: Department },
      { name: "Designation", model: Designation },
      { name: "Holiday", model: Holiday },
      { name: "Estimate", model: Estimate },
      { name: "Expenses", model: Expenses },
    ];

    const skip = (page - 1) * limit;
    const totalData = {};

    for (const { name, model } of models) {
      let query = model.find({ _id: { $in: _idArray } }).skip(skip).limit(parseInt(limit));

      // Dynamically apply populate based on the model
      if (name === "Project") {
        query = query
          .populate("clientName", "name email userId")
          .populate("assignedTo", "name email userId")
          .populate({
            path: "tasks",
            select: "name status assignedTo",
            populate: { path: "assignedTo", select: "name" },
          });
      } else if (name === "Estimate") {
        query = query
          .populate("client", "name email clientId address") // Include all relevant client fields
          .populate("project", "projectName projectId") // Include all relevant project fields
          .select("estimatesId client estimateDate project email taxType expiryDate status clientAddress billingAddress total tax discount GrandTotal otherInfo details"); // Explicitly select all required fields
      
       }else if (name === "Invoice") {
        query = query
          .populate("client" ) // Adjust the fields you want to include
          .populate("project" )
      }else if (name === "Expenses") {
        query = query
          .populate("purchaseBy", "name email userId") // Populate user-related fields
          .select(
            "expensesId item expanseName purchaseDate purchaseBy amount paidBy status files createdAt updatedAt"
          ); // Explicitly select all required fields
      }else if (name === "User") {
        query = query
        .populate("assigned", "name email userId");

      } else if (name === "Task") {
        query = query
          .populate("assignedTo", "name email userId")
          .populate("project", "projectName")
          .populate("assignedBy", "name email userId");
      } else if (name === "Product") {
        query = query.populate("category", "category");
      } else if (name === "Category") {
        query = query.select("category");
      }else if (name === "Designation") {
        query = query.populate("departments", "departments"); // Populate only the department name
      }else if (name === "Termination") {
        query = query.populate("employee", "name"); // Populate only the department name
      }else if (name === "Resignation") {
        query = query.populate("employee", "name email"); // Populate only the department name
      }
      

      const data = await query;

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

// Generate Excel File
const generateExcelFile = async (res, data) => {
  const workbook = new ExcelJS.Workbook();

  const flattenData = (entry) => {
    const flatObject = {};

    for (const [key, value] of Object.entries(entry)) {
      if (["_id", "password", "image", "__v"].includes(key)) {
        continue; // Skip unnecessary fields
      }

      if (key === "clientName" || key === "assignedTo" || key === "assignedBy" || key === "client") {
        flatObject[`${key}_Name`] = value?.name || "-";
        flatObject[`${key}_Email`] = value?.email || "-";
        flatObject[`${key}_UserId`] = value?.userId || "-";
      } else if (key === "tasks") {
        flatObject[key] =
          Array.isArray(value) && value.length > 0
            ? value.map((task) => `${task.name} (${task.status})`).join(", ")
            : "-";
      } else if (key === "details") {
        if (Array.isArray(value)) {
          value.forEach((detail, index) => {
            Object.entries(detail).forEach(([detailKey, detailValue]) => {
              flatObject[`Detail_${index + 1}_${detailKey}`] = detailValue || "-";
            });
          });
        } else {
          flatObject[key] = "-";
        }
      } else if (key === "purchaseBy") {
        flatObject["Purchased_By_Name"] = value?.name || "-";
        flatObject["Purchased_By_Email"] = value?.email || "-";
        flatObject["Purchased_By_UserId"] = value?.userId || "-";
      } else if (key === "files") {
        flatObject[key] =
          Array.isArray(value) && value.length > 0 ? value.join(", ") : "-";
      } else if (key === "installmentDetails") {
        if (Array.isArray(value)) {
          value.forEach((installment, index) => {
            flatObject[`Installment_${index + 1}_Date`] = installment.paymentDate || "-";
            flatObject[`Installment_${index + 1}_Amount`] = installment.paymentAmount || "-";
            flatObject[`Installment_${index + 1}_Status`] = installment.paymentStatus || "-";
          });
        } else {
          flatObject[key] = "-";
        }
      } else if (Buffer.isBuffer(value)) {
        flatObject[key] = value.toString("utf-8"); // Convert Buffer to string
      } 
      else if (key === "category") {
        flatObject[key] = value?.category || value || "-"; // Handle populated or raw category values
      } 
      else if (key === "project") {
        flatObject["Project_Name"] = value?.projectName || "-";
        flatObject["Project_ID"] = value?.projectId || "-";
      } 
      else if (key === "departments") {
        flatObject["Departments"] = value?.departments || value || "-";
      } 
      else if (key === "designations") {
        flatObject["Designations"] = value || "-";
      } 
      else if (key === "termination") {
        flatObject["Termination"] = value || "-";
      } 
      // else if (key === "resignation") {
      //   flatObject["Resignation"] = value || "-";
      // } 
      else if (typeof value === "object" && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          flatObject[`${key}_${nestedKey}`] = nestedValue || "-";
        }
      } else {
        flatObject[key] = value || "-";
      }
    }

    return flatObject;
  };
  
  
  for (const [modelName, modelData] of Object.entries(data)) {
    const worksheet = workbook.addWorksheet(modelName);

    const flatData = modelData.map((item) => flattenData(item.toObject()));

    // Capitalize only the first letter of the headers
    const formatHeader = (header) =>
      header.replace(/_/g, " ").replace(/\b\w/g, (char, index) => (index === 0 ? char.toUpperCase() : char.toLowerCase()));

    worksheet.columns = Object.keys(flatData[0] || {}).map((key) => ({
      header: formatHeader(key),
      key: key,
      width: 20,
    }));

    flatData.forEach((item) => worksheet.addRow(item));

    worksheet.addRow({});
    worksheet.addRow({ Total_Records: flatData.length });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="exported-data.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
};

// const flattenData = (entry) => {
//   const flatObject = {};

//   for (const [key, value] of Object.entries(entry)) {
//     if (["_id", "password", "image", "__v"].includes(key)) {
//       continue; // Skip unnecessary fields
//     }

//     if (Buffer.isBuffer(value)) {
//       // Decode buffer data into a human-readable string
//       flatObject[key] = value.toString("utf-8");
//     } else if (typeof value === "object" && value !== null) {
//       // Handle nested objects
//       for (const [nestedKey, nestedValue] of Object.entries(value)) {
//         flatObject[`${key}_${nestedKey}`] = Buffer.isBuffer(nestedValue)
//           ? nestedValue.toString("utf-8")
//           : nestedValue || "-";
//       }
//     } else if (Array.isArray(value)) {
//       // Handle arrays
//       flatObject[key] = value.join(", ") || "-";
//     } else {
//       flatObject[key] = value || "-";
//     }
//   }

//   return flatObject;
// };

// const formatHeader = (header) =>
//   header
//     .replace(/_/g, " ")
//     .toLowerCase()
//     .replace(/^\w|\s\w/g, (char) => char.toUpperCase());


// const generateExcelFile = async (res, data) => {
//   const workbook = new ExcelJS.Workbook();

//   for (const [modelName, modelData] of Object.entries(data)) {
//     const worksheet = workbook.addWorksheet(modelName);

//     const flatData = modelData.map((item) => flattenData(item.toObject()));

//     worksheet.columns = Object.keys(flatData[0] || {}).map((key) => ({
//       header: formatHeader(key),
//       key: key,
//       width: 20,
//     }));

//     flatData.forEach((item) => worksheet.addRow(item));

//     worksheet.addRow({});
//     worksheet.addRow({ Total_Records: flatData.length });
//   }

//   res.setHeader(
//     "Content-Type",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   );
//   res.setHeader("Content-Disposition", 'attachment; filename="exported-data.xlsx"');

//   await workbook.xlsx.write(res);
//   res.end();
// };






async function buildDynamicQuery(searchParams) {
  const query = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      query[key] = { $regex: value, $options: 'i' }; // Case-insensitive regex for all keys
    }
  }

  return query;
}


// Role-based restrictions
const applyRoleBasedRestrictions = async (query, roles, currentUserId) => {
  if (roles === "Admin") {
    return query; // Admin has full access
  } else if (roles === "Employee") {
    const assignedProjects = await getAssignedProjectsOrClients(currentUserId);
    query._id = { $in: assignedProjects };
  } else if (roles === "Supervisor") {
    const managedEmployees = await getManagedEmployees(currentUserId);
    query._id = { $in: managedEmployees };
  } else if (roles === "Manager") {
    const managedData = await getEmployeesOrProjectsManaged(currentUserId);
    query._id = { $in: managedData };
  } else if (roles === "HR") {
    query.roles = { $in: ["Employee", "Supervisor", "Manager"] };
  }
  return query;
};

// Fetch assigned projects or clients for an employee
const getAssignedProjectsOrClients = async (employeeId) => {
  const assignments = await User.find({ _id: employeeId }).select("assigned");
  return assignments.flatMap((assignment) => assignment.assigned);
};

// Fetch employees managed by a supervisor
const getManagedEmployees = async (supervisorId) => {
  const employees = await User.find({ supervisorId }).select("_id");
  return employees.map((employee) => employee._id);
};

// Fetch employees or projects managed by a manager
const getEmployeesOrProjectsManaged = async (managerId) => {
  const assignments = await User.find({ managerId }).select("assigned");
  return assignments.map((assignment) => assignment.assigned);
};

route.get('/global-search', auth, async (req, res) => {
  const { type, page = 1, limit = 10, sort = 'createdAt', order = 'asc', ...searchParams } = req.query;
  const skip = (page - 1) * limit;
  const { id: currentUserId, roles } = req.user;

  const model = getModelByName(type); // Dynamically fetch the model based on the type

  if (!model) {
    return res.status(400).json({ error: 'Invalid type parameter' });
  }

  try {
    // 1. Build the dynamic query
    let query = await buildDynamicQuery(searchParams);

    // 2. Apply role-based restrictions
    query = await applyRoleBasedRestrictions(query, roles, currentUserId);

    console.log('Query Data:', query);

    // 3. Build the query with find()
    // let queryBuilder = model.find(query);
     // 4. Apply conditional population based on the `type`
    // if (type === 'resignation') {
    //   queryBuilder = queryBuilder.populate({
    //     path: 'employee',
    //     select: 'name userId email', // Fields to include for employee
    //   });
    // }else if (type === 'termination') {
    //   queryBuilder = queryBuilder.populate({
    //     path: 'employee',
    //     select: 'name userId email', // Fields to include for employee
    //   });
    // }else if (type === 'project') {
    //   queryBuilder = queryBuilder
    //     .populate({
    //       path: 'clientName',
    //       match: searchParams['clientName.name'] // Match by client name if provided
    //         ? { name: { $regex: searchParams['clientName.name'], $options: 'i' } }
    //         : undefined, // Only apply if `clientName.name` exists
    //       select: 'name userId email', // Fields to include for client
    //     })
    //     .populate({
    //       path: 'assignedTo',
    //       select: 'name userId email', // Fields to include for assigned user
    //     });
    
    // } else if (type === 'otherType') {
    //   queryBuilder = queryBuilder.populate({
    //     path: 'project',
    //     select: 'projectName projectId', // Fields to include for project
    //   });
    // }

    // 5. Apply sorting, pagination, and execute the query
    // const results = await queryBuilder
    //   .sort({ [sort]: order === 'desc' ? -1 : 1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));
    // Fetch all data with population
    let results = await model
      .find(query)
      .populate({
        path: 'clientName',
        select: 'name userId email', // Fields to include for client
      })
      .populate({
        path: 'assignedTo',
        select: 'name userId email', // Fields to include for assigned user
      })
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter the populated data in JavaScript
    if (searchParams['clientName.name']) {
      results = results.filter((result) =>
        result.clientName?.name
          ?.toLowerCase()
          .includes(searchParams['clientName.name'].toLowerCase())
      );
    }
 
    // 6. Fetch total count
    const totalCount = await model.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // 7. Send response
    res.status(200).json({
      data: results,
      message: 'Search results fetched successfully!',
      totalCount,
      totalPages,
      currentPage: parseInt(page),
      perPage: parseInt(limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});








//Admin Dashboard


route.get('/dashboard', async (req, res) => {
  try {
    // Fetch counts for projects, clients, tasks, and employees
    const projectCountPromise = Project.countDocuments();
    const clientCountPromise = User.countDocuments({ roles: "Client" });
    const taskCountPromise = Task.countDocuments();
    const employeeCountPromise = User.countDocuments({ roles: "Employee" });

    // Fetch recent items with population for clients in invoices and projects
    const recentInvoicesPromise = Invoice.find()
    .sort({ dueDate: -1 })
    .limit(5)
    .populate("client", "name email userId")
    .populate("project", "projectName");// Fetch client details
  
    const recentClientsPromise = User.find({ roles: "Client" })
      .sort({ createdAt: -1 })
      .limit(5);

      const recentProjectsPromise = Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("clientName", "name email userId"); // Fetch client details
    
      const recentProductsPromise = Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("category", "category"); // Fetch category details
    
    // Await all promises simultaneously
    const [
      projectCount,
      clientCount,
      taskCount,
      employeeCount,
      recentInvoices,
      recentClients,
      recentProjects,
      recentProducts
    ] = await Promise.all([
      projectCountPromise,
      clientCountPromise,
      taskCountPromise,
      employeeCountPromise,
      recentInvoicesPromise,
      recentClientsPromise,
      recentProjectsPromise,
      recentProductsPromise
    ]);

    // Send a single JSON response containing all the fetched data
    res.status(200).json({
      counts: {
        projectCount,
        clientCount,
        taskCount,
        employeeCount
      },
      recentInvoices,
      recentClients,
      recentProjects,
      recentProducts
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

 



module.exports = route;
