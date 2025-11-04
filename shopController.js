const pool = require("../utils/db");

// Add new product (owner only)
exports.addProduct = async (req, res) => {
  // Should check if req.user is owner and owns the salon
  const { salon_id, name, category, description, price, stock } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO products (salon_id, name, category, description, price, stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [salon_id, name, category, description, price, stock]
    );
    conn.release();
    res.json({ message: "Product added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update product details (owner only)
exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { name, category, description, price, stock, is_active } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `UPDATE products SET name=?, category=?, description=?, price=?, stock=?, is_active=? WHERE product_id=?`,
      [name, category, description, price, stock, is_active, product_id]
    );
    conn.release();
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List products by salon
exports.getSalonProducts = async (req, res) => {
  const { salon_id } = req.params;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT * FROM products WHERE salon_id=? AND is_active=TRUE`,
      [salon_id]
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add product to cart
exports.addToCart = async (req, res) => {
  const { product_id, quantity, price, salon_id } = req.body;
  const user_id = req.user.user_id;
  try {
    const conn = await pool.getConnection();
    // Find or create cart for this user & salon
    const [cartRows] = await conn.query(
      `SELECT * FROM carts WHERE user_id=? AND salon_id=? AND status='active'`,
      [user_id, salon_id]
    );
    let cart_id;
    if (cartRows.length > 0) {
      cart_id = cartRows[0].cart_id;
    } else {
      const [result] = await conn.query(
        `INSERT INTO carts (user_id, salon_id, status) VALUES (?, ?, 'active')`,
        [user_id, salon_id]
      );
      cart_id = result.insertId;
    }
    await conn.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price, type) VALUES (?, ?, ?, ?, 'product')`,
      [cart_id, product_id, quantity, price]
    );
    conn.release();
    res.json({ message: "Added to cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// View cart
exports.getCart = async (req, res) => {
  const user_id = req.user.user_id;
  const { salon_id } = req.query;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT c.cart_id, ci.item_id, ci.product_id, p.name, ci.quantity, ci.price
       FROM carts c
       JOIN cart_items ci ON c.cart_id=ci.cart_id
       JOIN products p ON ci.product_id=p.product_id
       WHERE c.user_id=? AND c.salon_id=? AND c.status='active'`,
      [user_id, salon_id]
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Checkout cart
exports.checkoutCart = async (req, res) => {
  const user_id = req.user.user_id;
  const { salon_id, payment_method } = req.body;
  try {
    const conn = await pool.getConnection();
    // Find active cart
    const [cartRows] = await conn.query(
      `SELECT * FROM carts WHERE user_id=? AND salon_id=? AND status='active'`,
      [user_id, salon_id]
    );
    if (cartRows.length === 0)
      return res.status(400).json({ error: "No active cart" });
    const cart_id = cartRows[0].cart_id;
    // Sum total
    const [items] = await conn.query(
      `SELECT SUM(price*quantity) as total FROM cart_items WHERE cart_id=?`,
      [cart_id]
    );
    const total = items[0].total;
    if (!total) return res.status(400).json({ error: "Cart is empty" });
    // Create payment
    const [pay] = await conn.query(
      `INSERT INTO payments (user_id, amount, payment_method, payment_status) VALUES (?, ?, ?, 'completed')`,
      [user_id, total, payment_method]
    );
    // Create order
    const [orderRes] = await conn.query(
      `INSERT INTO orders (user_id, salon_id, total_amount, payment_id, payment_status, order_status) VALUES (?, ?, ?, ?, 'paid', 'completed')`,
      [user_id, salon_id, total, pay.insertId]
    );
    const order_id = orderRes.insertId;
    // Move cart_items to order_items
    const [cartItems] = await conn.query(
      `SELECT * FROM cart_items WHERE cart_id=?`,
      [cart_id]
    );
    for (let item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, type) VALUES (?, ?, ?, ?, 'product')`,
        [order_id, item.product_id, item.quantity, item.price]
      );
    }
    // Close cart
    await conn.query(`UPDATE carts SET status='checked_out' WHERE cart_id=?`, [
      cart_id,
    ]);
    conn.release();
    res.json({ message: "Order placed", order_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
