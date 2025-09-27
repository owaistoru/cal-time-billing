// backend/routes/exports.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize'); // Corrected import
const { TRAINING_POS, IDS_POS, applyMinRules } = require('../lib/constants');

const router = express.Router();

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

router.get('/timesheet', auth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    let tutorId;

    if (isAdmin) {
      tutorId = req.query.tutorId ? Number(req.query.tutorId) : null;
      if (!tutorId) {
        return res.status(400).json({ msg: 'tutorId is required for admin exports' });
      }
    } else {
      tutorId = req.user.id;
    }

    const from = req.query.from || '1900-01-01';
    const to = req.query.to || '2999-12-31';

    const { rows } = await db.query(
      `
      SELECT s.id, s.position, s.client_first_name, s.client_last_name,
             s.subject_code, s.course_number, s.notes, s.no_show, s.session_date,
             (s.session_date::timestamp + s.start_time) AS st,
             CASE WHEN s.end_time < s.start_time
                    THEN (s.session_date::timestamp + s.end_time + interval '1 day')
                  ELSE (s.session_date::timestamp + s.end_time)
             END AS en
        FROM sessions s
       WHERE s.tutor_id = $1
         AND s.status = 'approved'
         AND s.session_date BETWEEN $2::date AND $3::date
       ORDER BY s.session_date, s.start_time, s.id
      `,
      [tutorId, from, to]
    );

    const header = [
      'Position', 'Client First Name', 'Client Last Name', 'Subject (e.g. PSYC, LS)',
      'Course Number', 'Month', 'Day', 'Start Time', 'End Time', 'Hours', 'Notes',
    ];

    const csvRows = rows.map(r => {
      const start = new Date(r.st);
      const end = new Date(r.en);
      const rawHours = (end - start) / 3600000;
      const hours = applyMinRules(r.position, rawHours);

      const month = start.toLocaleString('en-CA', { month: 'long' });
      const day = start.getDate();

      const fmt12h = (d) =>
        d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      let cf = r.client_first_name || '';
      let cl = r.client_last_name || '';
      if (TRAINING_POS.has(r.position) || IDS_POS.has(r.position)) {
        cf = '';
        cl = '';
      }

      let notes = r.notes || '';
      if (r.no_show) notes = notes ? `${notes}; No show` : 'No show';

      return [
        r.position, cf, cl, r.subject_code, r.course_number,
        month, day, fmt12h(start), fmt12h(end),
        hours != null ? hours.toFixed(2) : '', notes,
      ].map(csvEscape).join(',');
    });

    const csv = [header.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="timesheet_${tutorId}_${from}_${to}.csv"`
    );
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

module.exports = router;