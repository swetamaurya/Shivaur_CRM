const express = require("express");
const router = express.Router();
const Attendance = require("../model/attendanceModel");
const { auth } = require("../Middleware/authorization");
const { User } = require("../model/userModel");

const DEFAULT_BREAK_DURATION_MINUTES = 60;
// Punch action endpoint
router.post("/attendance/punch", auth, async (req, res) => {
  const { userId, action } = req.body;
  const currentDate = new Date().toLocaleDateString('en-CA'); // Using local date in YYYY-MM-DD format

  try {
      let attendanceRecord = await Attendance.findOne({ userId, date: currentDate });

      // Create a new attendance record if it doesn't exist
      if (!attendanceRecord) {
          attendanceRecord = new Attendance({
              userId,
              date: currentDate,
              workSessions: [],
              breakSessions: [],
              totalWorkHours: 0,
              totalBreakHours: 0,
              status: "Absent",
          });
      }

      const now = new Date();

      if (action === "workPunchIn") {
          if (attendanceRecord.status === "Absent") {
              attendanceRecord.status = "Present";
          }

          const latestWorkSession = attendanceRecord.workSessions[attendanceRecord.workSessions.length - 1];
          if (latestWorkSession && latestWorkSession.punchIn && !latestWorkSession.punchOut) {
              return res.status(200).json({ message: "Already punched in.", attendanceRecord });
          }

          // Add a new work session
          attendanceRecord.workSessions.push({ punchIn: now });

      } else if (action === "workPunchOut") {
          const latestWorkSession = attendanceRecord.workSessions[attendanceRecord.workSessions.length - 1];
          if (latestWorkSession && !latestWorkSession.punchOut) {
              latestWorkSession.punchOut = now;

              const workDurationMinutes = Math.floor((now - new Date(latestWorkSession.punchIn)) / (1000 * 60));
              attendanceRecord.totalWorkHours += workDurationMinutes;
          } else {
              return res.status(400).json({ message: "Cannot punch out without punching in." });
          }

      } else if (action === "breakPunchIn") {
          const latestBreakSession = attendanceRecord.breakSessions[attendanceRecord.breakSessions.length - 1];
          if (latestBreakSession && !latestBreakSession.punchOut) {
              return res.status(200).json({ message: "Already on break.", attendanceRecord });
          }

          attendanceRecord.breakSessions.push({ punchIn: now });

      } else if (action === "breakPunchOut") {
          const latestBreakSession = attendanceRecord.breakSessions[attendanceRecord.breakSessions.length - 1];
          if (latestBreakSession && !latestBreakSession.punchOut) {
              latestBreakSession.punchOut = now;

              const breakDurationMinutes = Math.floor((now - new Date(latestBreakSession.punchIn)) / (1000 * 60));
              attendanceRecord.totalBreakHours += breakDurationMinutes;
          } else {
              return res.status(400).json({ message: "Cannot end break without starting it." });
          }

      } else {
          return res.status(400).json({ message: "Invalid action type." });
      }

      await attendanceRecord.save();
      res.status(200).json({ message: "Punch action successful", attendanceRecord });
  } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


// Fetch attendance records endpoint
router.get("/attendance/get", auth, async (req, res) => {
  try {
      const { roles, id: userId } = req.user;
      const query = roles === 'Admin' ? {} : { userId };

      const attendanceRecords = await Attendance.find(query);

      res.status(200).json({
          message: "Attendance records fetched successfully",
          attendanceRecords: attendanceRecords.map(record => {
              const latestWorkSession = record.workSessions[record.workSessions.length - 1] || {};
              const punchIn = latestWorkSession.punchIn || null;
              const punchOut = latestWorkSession.punchOut || null;

              // Calculate and format total work and break hours from minutes
              const totalWorkMinutes = record.totalWorkHours;
              const totalBreakMinutes = record.totalBreakHours;

              const workHours = Math.floor(totalWorkMinutes / 60);
              const workMinutes = totalWorkMinutes % 60;
              const totalWorkHoursDisplay = `${workHours} hrs ${workMinutes} mins`;

              const breakHours = Math.floor(totalBreakMinutes / 60);
              const breakMinutes = totalBreakMinutes % 60;
              const totalBreakHoursDisplay = `${breakHours} hrs ${breakMinutes} mins`;

              return {
                  date: record.date,
                  punchIn,
                  punchOut,
                  workSessions: record.workSessions,  // Include all work sessions
                  breakSessions: record.breakSessions,  // Include all break sessions
                  totalWorkHours: totalWorkHoursDisplay,
                  totalBreakHours: totalBreakHoursDisplay,
                  status: record.status,
              };
          })
      });
  } catch (error) {
      console.error("Error fetching attendance records:", error.message);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});




// Route to get attendance for a specific employee by userId (Admins and specific employee)
router.get("/attendance/user/:userId", auth, async (req, res) => {
  const { userId } = req.params;
  const { roles, _id: requesterId } = req.user;
  const { month, year } = req.query;

  if (roles !== 'Admin' && requesterId !== userId) {
    return res.status(403).json({ message: "Access denied." });
  }

  try {
    let filter = { userId };
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      filter.date = { $gte: startOfMonth.toISOString().split("T")[0], $lte: endOfMonth.toISOString().split("T")[0] };
    }

    const attendanceRecords = await Attendance.find(filter).sort({ date: 1 });
    res.status(200).json({ attendanceRecords });
  } catch (error) {
    console.error("Error fetching attendance data for user:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to get today's attendance for all employees (Admins only)
router.get('/attendance/today', auth, async (req, res) => {
  if (req.user.roles !== 'Admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const currentDate = new Date().toISOString().split("T")[0];

  try {
    const allEmployees = await User.find({ roles: { $in: ["Employee", "Supervisor"] } }).select("_id name role");

    const attendanceRecords = await Attendance.aggregate([
      { $match: { date: currentDate } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: 1,
          date: 1,
          status: 1,
          punchIn: { $arrayElemAt: ['$workSessions.punchIn', 0] },
          punchOut: { $arrayElemAt: ['$workSessions.punchOut', 0] },
          name: '$userInfo.name',
          role: '$userInfo.role'
        }
      }
    ]);

    const attendanceStatus = allEmployees.map(employee => {
      const attendanceRecord = attendanceRecords.find(record => String(record.userId) === String(employee._id));
      return attendanceRecord ? {
        userId: employee._id,
        name: employee.name,
        date: currentDate,
        punchIn: attendanceRecord.punchIn,
        punchOut: attendanceRecord.punchOut,
        status: "Present"
      } : {
        userId: employee._id,
        name: employee.name,
        date: currentDate,
        punchIn: null,
        punchOut: null,
        status: "Absent"
      };
    });

    res.status(200).json({ message: "Today's attendance status fetched successfully", attendanceStatus });
  } catch (error) {
    console.error("Error fetching today's attendance:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to get attendance by month and year
router.get('/attendance/monthYear/get', auth, async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return res.status(400).json({ message: "Valid month (1-12) and year are required." });
  }

  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // Last day of the month

    // Get all employees
    const allEmployees = await User.find({ roles: "Employee" });

    // Get attendance records for the selected month
    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth.toISOString().split("T")[0], $lte: endOfMonth.toISOString().split("T")[0] }
        }
      },
      {
        $group: {
          _id: "$userId",
          attendance: {
            $push: {
              date: "$date",
              status: "$status"
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          userId: "$_id",
          name: "$userInfo.name",
          attendance: 1
        }
      }
    ]);

    // Prepare formatted records with default "Absent" for missing dates
    const formattedRecords = allEmployees.map(employee => {
      const attendance = {};
      for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const dayString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        attendance[dayString] = "Absent"; // Default to "Absent"
      }

      const employeeRecord = attendanceRecords.find(record => record.userId.equals(employee._id));
      if (employeeRecord) {
        employeeRecord.attendance.forEach(day => {
          attendance[day.date] = day.status || "Absent";
        });
      }

      return {
        userId: employee._id,
        name: employee.name,
        attendance
      };
    });

    res.status(200).json({ attendanceRecords: formattedRecords });
  } catch (error) {
    console.error("Error fetching attendance records:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Route to get monthly attendance status for all users
router.get("/attendance/status", auth, async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year || isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return res.status(400).json({ message: "Valid month (1-12) and year are required." });
  }

  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const allUsers = await User.find();

    const attendanceRecords = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startOfMonth.toISOString().split("T")[0],
            $lte: endOfMonth.toISOString().split("T")[0]
          }
        }
      },
      {
        $group: {
          _id: "$userId",
          attendance: {
            $push: {
              date: "$date",
              status: "$status"
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          userId: "$_id",
          name: "$userInfo.name",
          attendance: 1
        }
      }
    ]);

    const formattedRecords = allUsers.map(user => {
      const attendance = {};
      for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const dayString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        attendance[dayString] = "Absent";
      }

      const userRecord = attendanceRecords.find(record => record.userId.equals(user._id));
      if (userRecord) {
        userRecord.attendance.forEach(day => {
          attendance[day.date] = day.status || "Absent";
        });
      }

      return {
        userId: user._id,
        name: user.name,
        attendance
      };
    });

    res.status(200).json({ attendanceStatus: formattedRecords });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
module.exports = router;



