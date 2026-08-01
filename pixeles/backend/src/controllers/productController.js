const { pool } = require("../config/database");

async function getAll(_req, res) {
  const result = await pool.query(
    "SELECT * FROM products ORDER BY category, name"
  );
  res.json({ products: result.rows });
}

async function getById(req, res) {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ product: result.rows[0] });
}

async function create(req, res) {
  const { name, category, price, cost, stock, branch_id, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Nombre y precio requeridos" });
  const result = await pool.query(
    `INSERT INTO products (name, category, price, cost, stock, branch_id, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, category || "snacks", price, cost || 0, stock || 0, branch_id || null, image_url || ""]
  );
  res.status(201).json({ product: result.rows[0] });
}

async function update(req, res) {
  const { id } = req.params;
  const { name, category, price, cost, stock, is_active, image_url } = req.body;
  const result = await pool.query(
    `UPDATE products SET name=COALESCE($1,name), category=COALESCE($2,category),
     price=COALESCE($3,price), cost=COALESCE($4,cost), stock=COALESCE($5,stock),
     is_active=COALESCE($6,is_active), image_url=COALESCE($7,image_url),
     updated_at=NOW() WHERE id=$8 RETURNING *`,
    [name, category, price, cost, stock, is_active, image_url, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ product: result.rows[0] });
}

async function remove(req, res) {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);
  if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ message: "Producto eliminado" });
}

module.exports = { getAll, getById, create, update, remove };
