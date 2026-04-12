async function testUpdate() {
  const payload = {
    tasker_building_name: "Test Building",
    tasker_gender_preference: "Other",
    tasker_languages: ["English", "Chinese"]
  };
  
  console.log("Sending payload to /api/auth/profile...");
  const res = await fetch("http://localhost:5001/api/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  console.log("Status:", res.status);
  if (res.ok) {
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } else {
    console.log("Error:", await res.text());
  }
}

testUpdate().catch(console.error);
