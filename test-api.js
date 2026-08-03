async function run() {
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "rahulelango2006@gmail.com", password: "password123" })
  });
  const loginData = await loginRes.json();
  console.log("Login data:", loginData);
  const token = loginData.token;
  console.log("Login token acquired:", !!token);

  let res = await fetch("http://localhost:5000/api/predictions/overview", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Predictions Overview status:", res.status);
  let data = await res.json().catch(() => null);
  console.log("Predictions Overview data:", data);

  res = await fetch("http://localhost:5000/api/users", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Users status:", res.status);
  data = await res.json().catch(() => null);
  console.log("Users length:", Array.isArray(data) ? data.length : "not array");
}
run();
