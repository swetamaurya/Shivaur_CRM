const express = require('express');
const router = express.Router();
const { Resignation, Termination } = require('../model/performationsModel');
const { auth } = require('../Middleware/authorization');

// Route to add a new resignation
router.post('/resignation/post', auth, async (req, res) => {
    try {
        const { noticeDate, resignationDate, ...otherData } = req.body;
        
        const resignation = new Resignation({
            ...otherData,
            noticeDate: noticeDate,
            resignationDate:  resignationDate,
            employee: req.user.id  // Assign the logged-in user's ID to the employee field
        });

        await resignation.save();
        res.status(201).json({ message: 'Resignation added successfully', resignation });
    } catch (error) {
        res.status(500).json({ message: 'Error adding resignation', error });
    }
});

router.get('/resignation/getAll', auth, async (req, res) => {
    try {
      const { roles, _id: userId } = req.user;
      const { page, limit } = req.query;
      const query = roles === 'Admin' ? {} : { employee: userId };
  
      if (!page || !limit) {
        const resignations = await Resignation.find(query)
          .populate('employee', 'name email')
           .sort({ _id: -1 });
  
        return res.status(200).json({
          data: resignations,
          totalResignations: resignations.length,
          pagination: false,
        });
      }
  
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      const resignations = await Resignation.find(query)
        .populate('employee', 'name email')
         .sort({ _id: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const totalResignations = await Resignation.countDocuments(query);
  
      res.status(200).json({
        data: resignations,
        totalResignations,
        totalPages: Math.ceil(totalResignations / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        pagination: true,
      });
    } catch (error) {
      console.error("Error retrieving resignations:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Route to get a specific resignation by ID
router.get('/resignation/getSingle/:_id', auth, async (req, res) => {
    try {
        const { roles, _id: userId } = req.user;
        
        const resignation = await Resignation.findById(req.params._id)
            .populate('employee', 'name email');
        
        if (!resignation) return res.status(404).json({ message: 'Resignation not found' });

      

        res.status(200).json(resignation);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving resignation', error });
    }
});

// Route to update a resignation (Admins only, or the user's own resignation)
router.post('/resignation/update', auth, async (req, res) => {
    try {
      const { roles, _id: userId } = req.user;
      const { _id, ...updateData } = req.body;

      const resignation = await Resignation.findById(_id);
      if (!resignation) return res.status(404).json({ message: 'Resignation not found' });

      if (roles !== 'Admin' && resignation.employee.toString() !== userId.toString()) {
          return res.status(403).json({ message: 'Access denied: Unauthorized to update this resignation.' });
      }

      const updatedResignation = await Resignation.findByIdAndUpdate(_id, updateData, { new: true });
      res.json(updatedResignation);
    } catch (error) {
      console.error("Error updating resignation:", error);
      res.status(500).json({ message: 'Error updating resignation', error });
    }
});

// Route to delete a resignation (Admins only, or the user's own resignation)
router.post("/resignation/delete/:_id", auth, async (req, res) => {
  try {
      const { roles, _id: userId } = req.user;
      const { _id } = req.params;

      const resignation = await Resignation.findById(_id);
      if (!resignation) return res.status(404).json({ message: 'Resignation not found' });

      if (roles !== 'Admin' && resignation.employee.toString() !== userId.toString()) {
          return res.status(403).json({ message: 'Access denied: Unauthorized to delete this resignation.' });
      }

      await resignation.deleteOne();
      res.status(200).send({ message: 'Resignation deleted successfully.' });
  } catch (error) {
      console.error("Error deleting resignation:", error);
      res.status(500).send({ message: `Internal server error: ${error.message}` });
  }
});

///////////////////////////////////////// Termination //////////////////////////////////

// Route to add a new termination
router.post('/termination/post', auth, async (req, res) => {
    try {
        const { noticeDate, terminationDate, ...otherData } = req.body;

        const termination = new Termination({
            ...otherData,
            noticeDate: new Date(noticeDate),
            terminationDate: new Date(terminationDate)
         });

        await termination.save();
        res.status(201).json({ message: 'Termination added successfully', termination });
    } catch (error) {
        res.status(500).json({ message: 'Error adding termination', error });
    }
});

router.get('/termination/getAll', auth, async (req, res) => {
    try {
      const { roles, _id: userId } = req.user;
      console.log(req.user)
      const { page, limit } = req.query;
      const query = roles === 'Admin' ? {} : { employee: userId };
  
      if (!page || !limit) {
        const terminations = await Termination.find(query)
          .populate('employee', 'name userId')
           .sort({ _id: -1 });
  
        return res.status(200).json({
          data: terminations,
          totalTerminations: terminations.length,
          pagination: false,
        });
      }
  
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      const terminations = await Termination.find(query)
        .populate('employee', 'name userId')
         .sort({ _id: -1 })
        .skip(skip)
        .limit(parseInt(limit));
  
      const totalTerminations = await Termination.countDocuments(query);
  
      res.status(200).json({
        data: terminations,
        totalTerminations,
        totalPages: Math.ceil(totalTerminations / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        pagination: true,
      });
    } catch (error) {
      console.error("Error retrieving terminations:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Route to get a specific termination by ID
router.get('/termination/getSingle/:_id', auth, async (req, res) => {
    try {
        const { roles, _id: userId } = req.user;
        
        const termination = await Termination.findById(req.params._id)
            .populate('employee', 'name userId');
        
        if (!termination) return res.status(404).json({ message: 'Termination not found' });

        if (roles !== 'Admin' && termination.employee._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied: Unauthorized to view this termination.' });
        }

        res.status(200).json(termination);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving termination', error });
    }
});

// Route to update a termination (Admins only, or the user's own termination)
router.post('/termination/update', auth, async (req, res) => {
    try {
      const { roles, _id: userId } = req.user;
      const { _id, ...updateData } = req.body;

      const termination = await Termination.findById(_id);
      if (!termination) return res.status(404).json({ message: 'Termination not found' });

      if (roles !== 'Admin' && termination.employee.toString() !== userId.toString()) {
          return res.status(403).json({ message: 'Access denied: Unauthorized to update this termination.' });
      }

      const updatedTermination = await Termination.findByIdAndUpdate(_id, updateData, { new: true });
      res.json(updatedTermination);
    } catch (error) {
      console.error("Error updating termination:", error);
      res.status(500).json({ message: 'Error updating termination', error });
    }
});

// Route to delete a termination (Admins only, or the user's own termination)
router.post("/termination/delete/:_id", auth, async (req, res) => {
  try {
      const { roles, _id: userId } = req.user;
      const { _id } = req.params;

      const termination = await Termination.findById(_id);
      if (!termination) return res.status(404).json({ message: 'Termination not found' });

      if (roles !== 'Admin' && termination.employee.toString() !== userId.toString()) {
          return res.status(403).json({ message: 'Access denied: Unauthorized to delete this termination.' });
      }

      await termination.deleteOne();
      res.status(200).send({ message: 'Termination deleted successfully.' });
  } catch (error) {
      console.error("Error deleting termination:", error);
      res.status(500).send({ message: `Internal server error: ${error.message}` });
  }
});

module.exports = router;
