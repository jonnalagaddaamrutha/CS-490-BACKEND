const pool = require("../utils/db");

// Get available barbers and calculate open time slots based on availability and appointments/time off
exports.getAvailableBarbersAndSlots = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Step 1: Get barbers with user info
    const [barbers] = await conn.query(
      `SELECT staff.staff_id, users.full_name, staff.specialization, staff.salon_id
       FROM staff 
       JOIN users ON staff.user_id = users.user_id
       WHERE staff.role = 'barber' AND staff.is_active = TRUE`
    );

    // Step 2: Calculate available slots for each barber for the next 7 days
    // Simplified as example: get staff availability per day of week and exclude blocked & booked times
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    let allSlots = [];
    for (const barber of barbers) {
      const barberSlots = [];

      for (const day of days) {
        const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
        // Get staff availability
        const [availabilities] = await conn.query(
          `SELECT * FROM staff_availability WHERE staff_id = ? AND day_of_week = ? AND is_available = TRUE`,
          [barber.staff_id, dayName]
        );
        // Get staff time off to exclude blocked times for that day
        const [timeoffs] = await conn.query(
          `SELECT * FROM staff_time_off WHERE staff_id = ? AND status = 'approved' AND 
           ((start_datetime <= ? AND end_datetime >= ?) OR (start_datetime >= ? AND start_datetime <= ?))`,
          [
            barber.staff_id,
            day,
            day,
            day,
            new Date(day.getTime() + 24 * 60 * 60 * 1000),
          ]
        );
        // Get booked appointments for that day
        const [appointments] = await conn.query(
          `SELECT * FROM appointments WHERE staff_id = ? AND status = 'booked' 
           AND scheduled_time BETWEEN ? AND ?`,
          [barber.staff_id, day, new Date(day.getTime() + 24 * 60 * 60 * 1000)]
        );

        // Calculate open slots by splitting availability into slots and removing blocked/appointments (use 30-min slots as example)
        for (const avail of availabilities) {
          const startTime = new Date(day);
          startTime.setHours(
            avail.start_time.split(":")[0],
            avail.start_time.split(":")[1],
            0
          );

          const endTime = new Date(day);
          endTime.setHours(
            avail.end_time.split(":")[0],
            avail.end_time.split(":")[1],
            0
          );

          let currentSlot = new Date(startTime);

          while (currentSlot < endTime) {
            const slotEnd = new Date(currentSlot.getTime() + 30 * 60000); // 30 min slot

            // Check blocked by time off?
            const blocked = timeoffs.some(
              (t) =>
                new Date(t.start_datetime) < slotEnd &&
                new Date(t.end_datetime) > currentSlot
            );

            // Check booked by appointment?
            const booked = appointments.some(
              (a) =>
                new Date(a.scheduled_time) <= currentSlot &&
                new Date(a.scheduled_time).getTime() + 30 * 60000 >
                  currentSlot.getTime()
            );

            if (!blocked && !booked && slotEnd <= endTime) {
              barberSlots.push({
                date: day.toISOString().split("T")[0],
                start_time: currentSlot.toTimeString().substring(0, 5),
                end_time: slotEnd.toTimeString().substring(0, 5),
              });
            }

            currentSlot = slotEnd;
          }
        }
      }

      allSlots.push({
        barber_id: barber.staff_id,
        barber_name: barber.full_name,
        salon_id: barber.salon_id,
        slots: barberSlots,
      });
    }

    conn.release();
    res.json({ barbers: allSlots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Book appointment
exports.bookAppointment = async (req, res) => {
  const { staff_id, salon_id, service_id, scheduled_time } = req.body;
  const user_id = req.user.user_id;
  try {
    const conn = await pool.getConnection();

    // Check if slot is available (no overlapping approved time off or booked appts)
    const [count] = await conn.query(
      `SELECT COUNT(*) as count FROM appointments AS a
       LEFT JOIN staff_time_off AS t ON a.staff_id = t.staff_id AND t.status = 'approved' 
       WHERE a.staff_id = ? AND a.status = 'booked' AND a.scheduled_time = ?`,
      [staff_id, scheduled_time]
    );

    if (count[0].count > 0) {
      conn.release();
      return res
        .status(400)
        .json({ error: "Selected time is already booked or blocked" });
    }

    // Insert appointment
    await conn.query(
      `INSERT INTO appointments (user_id, salon_id, staff_id, service_id, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?, 'booked')`,
      [user_id, salon_id, staff_id, service_id, scheduled_time]
    );

    conn.release();
    res.json({ message: "Appointment booked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  const appointment_id = req.params.id;
  const { new_scheduled_time } = req.body;
  try {
    const conn = await pool.getConnection();

    // Get existing appointment details
    const [[appointment]] = await conn.query(
      `SELECT staff_id FROM appointments WHERE appointment_id = ?`,
      [appointment_id]
    );

    if (!appointment) {
      conn.release();
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if new slot is available
    const [count] = await conn.query(
      `SELECT COUNT(*) AS count FROM appointments 
       WHERE staff_id = ? AND status = 'booked' AND scheduled_time = ? AND appointment_id != ?`,
      [appointment.staff_id, new_scheduled_time, appointment_id]
    );
    if (count[0].count > 0) {
      conn.release();
      return res
        .status(400)
        .json({ error: "Selected new time is already booked" });
    }

    // Update appointment with new time
    await conn.query(
      `UPDATE appointments SET scheduled_time = ?, status = 'booked' WHERE appointment_id = ?`,
      [new_scheduled_time, appointment_id]
    );

    conn.release();
    res.json({ message: "Appointment rescheduled successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  const appointment_id = req.params.id;
  try {
    const conn = await pool.getConnection();

    // Mark appointment as cancelled
    await conn.query(
      `UPDATE appointments SET status = 'cancelled' WHERE appointment_id = ?`,
      [appointment_id]
    );

    conn.release();
    res.json({ message: "Appointment cancelled." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Barber view schedule (today)
exports.getBarberSchedule = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const conn = await pool.getConnection();

    // Get staff_id for this user id (barber)
    const [[staff]] = await conn.query(
      `SELECT staff_id FROM staff WHERE user_id = ?`,
      [user_id]
    );
    if (!staff) {
      conn.release();
      return res.status(403).json({ error: "User is not a staff/barber" });
    }

    const [appointments] = await conn.query(
      `SELECT a.appointment_id, a.status, a.scheduled_time, s.custom_name AS service_name, u.full_name AS customer_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.service_id
       LEFT JOIN users u ON a.user_id = u.user_id
       WHERE a.staff_id = ? AND DATE(a.scheduled_time) = CURDATE() AND a.status = 'booked'
       ORDER BY a.scheduled_time`,
      [staff.staff_id]
    );

    conn.release();
    res.json({ schedule: appointments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Barber block unavailable time slot (staff_time_off)
exports.blockTimeSlot = async (req, res) => {
  const user_id = req.user.user_id;
  const { start_datetime, end_datetime, reason } = req.body;
  try {
    const conn = await pool.getConnection();

    // Get staff_id for user
    const [[staff]] = await conn.query(
      `SELECT staff_id FROM staff WHERE user_id = ?`,
      [user_id]
    );

    if (!staff) {
      conn.release();
      return res.status(403).json({ error: "User is not a staff/barber" });
    }

    // Insert a blocking time slot with approved status for simplicity
    await conn.query(
      `INSERT INTO staff_time_off (staff_id, start_datetime, end_datetime, reason, status)
       VALUES (?, ?, ?, ?, 'approved')`,
      [
        staff.staff_id,
        start_datetime,
        end_datetime,
        reason || "Blocked time slot",
      ]
    );

    conn.release();
    res.json({ message: "Time slot blocked successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
