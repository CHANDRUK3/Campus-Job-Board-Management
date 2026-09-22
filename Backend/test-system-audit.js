const BASE = 'http://localhost:5000/api';

async function runAudit() {
  try {
    console.log('--- STARTING SYSTEM AUDIT ---\n');

    // 1. Health
    const health = await fetch(`${BASE}/health`).then(r => r.json());
    console.log('1. Health Check:', health);

    // 2. Admin Login
    const adminLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campus.edu', password: 'Admin123!' })
    }).then(r => r.json());
    console.log('2. Admin Login:', adminLogin.message, '| Role:', adminLogin.user?.role);
    const adminToken = adminLogin.accessToken;

    // 3. Student Login (John)
    const johnLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@student.edu', password: 'Student123!' })
    }).then(r => r.json());
    console.log('3. Student Login (John):', johnLogin.message, '| Role:', johnLogin.user?.role);
    const johnToken = johnLogin.accessToken;

    // 4. Invalid Login
    const invalidLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@student.edu', password: 'WrongPassword' })
    });
    console.log('4. Invalid Login Status:', invalidLogin.status, '(Expected 401)');

    // 5. Student Drives List
    const drives = await fetch(`${BASE}/drives`).then(r => r.json());
    console.log('5. Drives List Count:', drives.length);

    // 6. Security Test: Student Token accessing Admin Endpoint
    const secTest = await fetch(`${BASE}/admin/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    });
    console.log('6. Security Test (Student calling Admin API):', secTest.status, '(Expected 403 Forbidden)');

    // 7. Admin Analytics
    const adminAnalytics = await fetch(`${BASE}/admin/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    }).then(r => r.json());
    console.log('7. Admin Analytics:', adminAnalytics);

    // 8. Opt-In Application (Jane applying for DataFlow Data Analyst)
    const janeLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@student.edu', password: 'Student123!' })
    }).then(r => r.json());
    const janeToken = janeLogin.accessToken;
    const dataFlowDrive = drives.find(d => d.role === 'Data Analyst');

    const optInRes = await fetch(`${BASE}/student/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${janeToken}` },
      body: JSON.stringify({ jobId: dataFlowDrive._id })
    });
    const optInData = await optInRes.json();
    console.log('8. Opt-In Status:', optInRes.status, '| Message:', optInData.message);

    // 9. Duplicate Opt-In Prevention Test
    const dupRes = await fetch(`${BASE}/student/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${janeToken}` },
      body: JSON.stringify({ jobId: dataFlowDrive._id })
    });
    const dupData = await dupRes.json();
    console.log('9. Duplicate Opt-In Status:', dupRes.status, '| Message:', dupData.message, '(Expected Error/Conflict)');

    // 10. Non-existent Search Test
    const emptySearch = await fetch(`${BASE}/drives/search?q=XYZ-NONEXISTENT`).then(r => r.json());
    console.log('10. Non-existent Search Result Count:', emptySearch.jobs?.length || emptySearch.length || 0);

    // 11. Notifications Test
    const notifs = await fetch(`${BASE}/notifications`, {
      headers: { Authorization: `Bearer ${johnToken}` }
    }).then(r => r.json());
    console.log('11. Notifications Check:', notifs.success ? notifs.data.notifications.length : 'Failed');

    console.log('\n--- AUDIT SCRIPT COMPLETE ---');
  } catch (err) {
    console.error('Audit script error:', err);
  }
}

runAudit();
