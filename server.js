require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/courses", (req, res) => {
  const sql = "SELECT * FROM courses";
  db.query(sql, async (err, courses) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const sqlLectures = `SELECT * FROM \`${course.code}\``;

        await new Promise((resolve, reject) => {
          db.query(sqlLectures, async (err, lectures) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              // Fetch materials for each lecture
              for (let j = 0; j < lectures.length; j++) {
                const lecture = lectures[j];
                const sqlMaterials = `SELECT * FROM \`${course.code}_materials\` WHERE topic = ?`;
                const topicName = `${courses[i].code}_L${j + 1}`;
                await new Promise((resolveMaterial, rejectMaterial) => {
                  db.query(sqlMaterials, [topicName], (err, materials) => {
                    if (err) {
                      console.log(err);
                      rejectMaterial(err);
                    } else {
                      lecture.materials = materials;
                      resolveMaterial();
                    }
                  });
                });
              }
              course.lectures = lectures;
              resolve();
            }
          });
        });
      }
      res.json(courses);
    }
  });
});

app.get("/announcements", (req, res) => {
  const sql = "SELECT * FROM announcement";
  db.query(sql, (err, announcements) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
    res.json(announcements);
  });
});

app.get("/exams", (req, res) => {
  const sql = "SELECT * FROM exams";
  db.query(sql, (err, exams) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      const promises = exams.map((exam) => {
        return new Promise((resolve, reject) => {
          const sql = "SELECT * FROM exams_answers WHERE exam_id = ?";
          db.query(sql, [exam.id], (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              exam.answer = result[0];
              resolve(exam);
            }
          });
        });
      });
      Promise.all(promises)
        .then((examsWithAnswers) => {
          res.json(examsWithAnswers);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send(err);
        });
    }
  });
});

// app.get("/questions", (req, res) => {
//   const sql = "SELECT * FROM questions";
//   db.query(sql, (err, questions) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send(err);
//     }
//     res.json(questions);
//   });
// });
