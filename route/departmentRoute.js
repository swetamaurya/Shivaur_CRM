const express = require('express');
const router = express.Router();
const { Department, Designation } = require('../model/departmentModel');
const { auth } = require('../Middleware/authorization');

// Department CRUD Operations

// Create a new department
router.post('/departments/post', auth, async (req, res) => {
  try {
    const newDepartment = new Department(req.body);
    await newDepartment.save();
    console.log("Department Created:", newDepartment);
    res.status(200).json(newDepartment);
  } catch (error) {
    console.error("Error creating department:", error.message);
    res.status(500).json({ error: 'Error creating department' });
  }
});

router.get('/departments/get', auth, async (req, res) => {
  try {
    const { page, limit } = req.query; // Extract pagination parameters

    if (!page || !limit) {
      // If pagination parameters are not provided, return all data
      const departments = await Department.find().sort({ _id: -1 }); // Sort by creation date descending
      return res.status(200).json({
        data: departments,
        totalDepartments: departments.length, // Total count of all departments
        pagination: false, // Indicate that pagination is not applied
      });
    }

    // If pagination parameters are provided, return paginated data
    const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate documents to skip

    const departments = await Department.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDepartments = await Department.countDocuments(); // Total count of all departments

    res.status(200).json({
      data: departments,
      totalDepartments,
      totalPages: Math.ceil(totalDepartments / limit), // Calculate total pages
      currentPage: parseInt(page), // Current page
      perPage: parseInt(limit), // Items per page
      pagination: true, // Indicate that pagination is applied
    });
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    res.status(500).json({ error: 'Error fetching departments' });
  }
});


// Update a department
router.post('/departments/update', auth, async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;

    const departmentUpdate = await Department.findByIdAndUpdate(_id, updateData, { new: true });
    if (!departmentUpdate) {
      return res.status(404).json({ message: "Department not found" });
    }
    
    res.status(200).json(departmentUpdate);
  } catch (error) {
    console.error("Error updating department:", error.message);
    res.status(500).json({ error: 'Error updating department' });
  }
});

// Delete a department
router.post('/departments/delete', auth, async (req, res) => {
  try {
    const { _id } = req.body;
    const department = await Department.findByIdAndDelete(_id);

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error("Error deleting department:", error.message);
    res.status(500).json({ error: 'Error deleting department' });
  }
});

// Designation CRUD Operations

// Create a new designation
router.post('/designations/post', auth, async (req, res) => {
  try {
    const newDesignation = new Designation(req.body);
    await newDesignation.save();
    console.log("Designation Created:", newDesignation);
    res.status(200).json(newDesignation);
  } catch (error) {
    console.error("Error creating designation:", error.message);
    res.status(500).json({ error: 'Error creating designation' });
  }
});

// Fetch all designations with department details
router.get('/designations/get', auth, async (req, res) => {
  try {
    const { page, limit } = req.query; // Extract pagination parameters

    if (!page || !limit) {
      // If pagination parameters are not provided, return all data
      const designations = await Designation.find()
        .populate('departments', 'departments') // Only select 'departments' field
        .sort({ _id: -1 });

      return res.status(200).json({
        data: designations,
        totalDesignations: designations.length, // Total count of all designations
        pagination: false, // Indicate that pagination is not applied
      });
    }

    // If pagination parameters are provided, return paginated data
    const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate documents to skip

    const designations = await Designation.find()
      .populate('departments', 'departments') // Only select 'departments' field
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDesignations = await Designation.countDocuments(); // Total count of all designations

    res.status(200).json({
      data: designations,
      totalDesignations,
      totalPages: Math.ceil(totalDesignations / limit), // Calculate total pages
      currentPage: parseInt(page), // Current page
      perPage: parseInt(limit), // Items per page
      pagination: true, // Indicate that pagination is applied
    });
  } catch (error) {
    console.error("Error fetching designations:", error.message);
    res.status(500).json({ error: 'Error fetching designations' });
  }
});


// Update a designation
router.post('/designations/update', auth, async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    const designation = await Designation.findByIdAndUpdate(_id, updateData, { new: true });

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }

    res.status(200).json(designation);
  } catch (error) {
    console.error("Error updating designation:", error.message);
    res.status(500).json({ error: 'Error updating designation' });
  }
});

// Delete a designation
router.post('/designations/delete', auth, async (req, res) => {
  try {
    const { _id } = req.body;
    const designation = await Designation.findByIdAndDelete(_id);

    if (!designation) {
      return res.status(404).json({ error: 'Designation not found' });
    }

    res.status(200).json({ message: 'Designation deleted successfully' });
  } catch (error) {
    console.error("Error deleting designation:", error.message);
    res.status(500).json({ error: 'Error deleting designation' });
  }
});

module.exports = router;
