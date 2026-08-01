const { pool } = require("../config/database");

async function getAll(_req, res) {
  const result = await pool.query("SELECT * FROM branches ORDER BY name");
  res.json({ branches: result.rows });
}

async function getById(req, res) {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM branches WHERE id=$1", [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Sucursal no encontrada" });
  res.json({ branch: result.rows[0] });
}

async function create(req, res) {
  const { name, address, phone } = req.body;
  if (!name) return res.status(400).json({ error: "Nombre requerido" });
  const result = await pool.query(
    "INSERT INTO branches (name, address, phone) VALUES ($1,$2,$3) RETURNING *",
    [name, address || "", phone || ""]
  );
  res.status(201).json({ branch: result.rows[0] });
}

async function update(req, res) {
  const { id } = req.params;
  const { name, address, phone, status } = req.body;
  const result = await pool.query(
    `UPDATE branches SET name=COALESCE($1,name), address=COALESCE($2,address),
     phone=COALESCE($3,phone), status=COALESCE($4,status) WHERE id=$5 RETURNING *`,
    [name, address, phone, status, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Sucursal no encontrada" });
  res.json({ branch: result.rows[0] });
}

async function remove(req, res) {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM branches WHERE id=$1 RETURNING *", [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Sucursal no encontrada" });
  res.json({ message: "Sucursal eliminada" });
}

module.exports = { getAll, getById, create, update, remove };
