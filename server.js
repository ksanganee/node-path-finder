const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.static("public"))
app.set("views", "./views")

app.use(bodyParser.urlencoded({ extended: false}))
app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/finder", (req, res) => {
  let cols = req.body.ColCount
  let rows = req.body.RowCount
  res.render("finder", {data: {cols: cols, rows: rows}});
})

app.get("/test", (req, res) => {
  res.render("finder", {data: {cols: 100, rows: 50}});
})

app.listen(3000)
