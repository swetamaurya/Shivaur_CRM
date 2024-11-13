const express = require('express');
const { auth } = require('../Middleware/authorization');
const { Holiday, Leaves ,LeaveType } = require('../model/holidayModel');
 const route = express.Router();

// Holiday CRUD Operations

// Route to create a new holiday
route.post('/holiday/post', auth, async (req, res) => {
    if (req.user.roles !== 'Admin') {
        return res.status(403).send('Access denied: Only admins can create holidays.');
    }
    
    const createHoliday = new Holiday(req.body);
    try {
        const savedHoliday = await createHoliday.save();
        res.status(200).send(savedHoliday);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to fetch all holidays (accessible to all authenticated users)
route.get('/holiday/get', auth, async (req, res) => {
    try {
        const getAllHolidays = await Holiday.find().sort({_id :-1});
        res.status(200).send(getAllHolidays);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Route to update a holiday (Admins only)
route.post('/holiday/update', auth, async (req, res) => {
    if (req.user.roles !== 'Admin') {
        return res.status(403).send('Access denied: Only admins can update holidays.');
    }
    
    const { _id } = req.body;
    try {
        const updateHoliday = await Holiday.findByIdAndUpdate(_id, req.body, { new: true });
        if (!updateHoliday) return res.status(404).send('Holiday not found');
        res.status(200).send(updateHoliday);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to delete a holiday (Admins only)
route.post('/holiday/delete', auth, async (req, res) => {
    if (req.user.roles !== 'Admin') {
        return res.status(403).send('Access denied: Only admins can delete holidays.');
    }
    
    const { _id } = req.body;
    try {
        const deleteHoliday = await Holiday.findByIdAndDelete(_id);
        if (!deleteHoliday) return res.status(404).send('Holiday not found');
        res.status(200).send(deleteHoliday);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Leaves CRUD Operations

// Route to create a new leave request
route.post('/leaves/post', auth, async (req, res) => {
    try {
        const addLeave = new Leaves({
            ...req.body,
            employee: req.user.id, // Associate leave request with the logged-in user
            approvedBy: null, // Approval will be set later
        });
        await addLeave.save();
        console.log(addLeave)

        res.status(200).send(addLeave);
    } catch (error) {
        console.error('Error creating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


route.get('/leaves/get', auth, async (req, res) => {
    try {
        const { roles, id: userId } = req.user;
        console.log("req.user:", req.user);

        // Define the query based on role
        let query = {};
        if (roles === "Employee") {
            // For Employees, filter by their own userId (as a string)
            query = { employee: userId };
            console.log(query)
        }

        // Fetch the leaves based on the query
        const leaves = await Leaves.find(query)
            .populate('employee', 'name email')
            .populate('approvedBy', 'name email')
            .populate('leaveType', 'leaveName')
            .sort({ createdAt: -1 }); // Sorting by created date (most recent first)

        console.log("Fetched Leaves:", leaves); // Log the fetched leaves

        // Calculate leave summary
        const totalLeavesTaken = leaves.reduce((sum, leave) => sum + Number(leave.leavesTaken || 0), 0);
        const totalPendingRequests = leaves.filter(leave => leave.leaveStatus === 'Pending').length;
        const totalApprovedLeaves = leaves.filter(leave => leave.leaveStatus === 'Approved').length;
        const totalRejectedLeaves = leaves.filter(leave => leave.leaveStatus === 'Rejected').length;

        const totalAvailableLeaves = leaves.length > 0 ? Number(leaves[0].totalLeaves) : 0;
        const totalRemainingLeaves = totalAvailableLeaves - totalLeavesTaken;

        res.status(200).json({
            summary: {
                totalLeavesTaken,
                totalPendingRequests,
                totalApprovedLeaves,
                totalRejectedLeaves,
                totalAvailableLeaves,
                totalRemainingLeaves,
            },
            leaves
        });
    } catch (error) {
        console.error('Error fetching leaves:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});





// Route to get a specific leave request by ID
route.get('/leaves/get/:id', auth, async (req, res) => {
    try {
        const {id} = req.params
        console.log(req.params)
         const leave = await Leaves.findById(id)
            .populate('employee', 'name email userId')
            .populate('approvedBy', 'name email userId')
            .populate('leaveType', 'leaveName');

        if (!leave) return res.status(404).json({ error: 'Leave not found' });

      

        res.status(200).json(leave);
    } catch (error) {
        console.error('Error fetching leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


// Route to update a leave request (Admins only or employee updating their own leave)
route.post('/leaves/update', auth, async (req, res) => {
    const { _id } = req.body;
    try {
        const leave = await Leaves.findById(_id);
        if (!leave) return res.status(404).json({ error: 'Leave not found' });

      

        const updatedLeave = await Leaves.findByIdAndUpdate(_id, req.body, { new: true });
        res.status(200).send(updatedLeave);
    } catch (error) {
        console.error('Error updating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

 

// Route to approve or decline a leave request (Admins only)
route.post('/leaves/approve', auth, async (req, res) => {
    const { _id, leaveStatus } = req.body;
    const approvedBy = req.user._id;

    if (req.user.roles !== 'Admin') {
        return res.status(403).json({ message: 'Access denied: Only admins can approve or decline leave requests.' });
    }

    if (!_id || !leaveStatus || (leaveStatus !== 'Approved' && leaveStatus !== 'Declined')) {
        return res.status(400).json({ message: 'Missing or invalid fields. Status must be either "Approved" or "Declined".' });
    }

    try {
        const updatedLeave = await Leaves.findByIdAndUpdate(
            _id,
            { leaveStatus, approvedBy },
            { new: true }
        );

        if (!updatedLeave) return res.status(404).json({ message: 'Leave request not found' });

        const message = leaveStatus === 'Approved' ? 'Leave approved successfully' : 'Leave declined';
        res.status(200).json({ message, leave: updatedLeave });
    } catch (error) {
        console.error(`Error updating leave request: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});



///////////////////////////// Leave type /////////////////////
route.post('/leavesType/post', auth, async (req, res) => {
    try {
        const{leaveName,durationLeave,day} =req.body

        const addLeave = new LeaveType({
            leaveName,durationLeave,day

    });
     
        await addLeave.save();
        console.log("addLeave",addLeave)
        res.status(200).send(addLeave);
    } catch (error) {
        console.error('Error creating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});
 

route.get('/leavesType/get', auth, async (req, res) => {
    try {
        const leaves = await LeaveType.find().sort({_id :-1})

        res.status(200).send(leaves);
    } catch (error) {
        console.error('Error creating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

route.get('/leavesType/get/id', auth, async (req, res) => {
    try {
        const {id} = req.params
        console.log("leave type",req.params)
         const leaves = await LeaveType.findById(id)

        res.status(200).send(leaves);
    } catch (error) {
        console.error('Error creating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

 route.post('/leavesType/update', auth, async (req, res) => {
    const { _id } = req.body;
    try {
        const leave = await LeaveType.findById(_id);
        if (!leave) return res.status(404).json({ error: 'Leave not found' });

        if (req.user.roles !== 'Admin' && leave.employee.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied: Unauthorized to update this leave.' });
        }

        const updatedLeave = await LeavesType.findByIdAndUpdate(_id, req.body, { new: true });
        res.status(200).send(updatedLeave);
    } catch (error) {
        console.error('Error updating leave:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


 
module.exports = route;
