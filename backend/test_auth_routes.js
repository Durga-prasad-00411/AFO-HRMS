const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  const token = jwt.sign({ id: 1, role: 'SUPER_ADMIN', role_id: 1 }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });
  
  try {
    const resTypes = await fetch("http://localhost:5000/api/leave-types", { headers: { Authorization: `Bearer ${token}` } });
    const dataTypes = await resTypes.json();
    console.log("leave-types OK:", resTypes.status, JSON.stringify(dataTypes));
  } catch(e) {
    console.error("leave-types error:", e.message);
  }

  try {
    const resBals = await fetch("http://localhost:5000/api/leave-balances/my-balances", { headers: { Authorization: `Bearer ${token}` } });
    const dataBals = await resBals.json();
    console.log("leave-balances OK:", resBals.status, JSON.stringify(dataBals));
  } catch(e) {
    console.error("leave-balances error:", e.message);
  }
}
test();
