const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', { email: 'vendor@example.com', password: 'password123' });
    const token = loginRes.data.token;
    console.log('Login success');
    
    const page1 = await axios.get('http://localhost:5000/api/enquiries/vendor?type=my&page=1&limit=2', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Page 1 total:', page1.data.totalCount, 'returned data length:', page1.data.data ? page1.data.data.length : page1.data.length);
    console.log('Page 1 totalPages:', page1.data.totalPages);

    const page2 = await axios.get('http://localhost:5000/api/enquiries/vendor?type=my&page=2&limit=2', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Page 2 returned data length:', page2.data.data ? page2.data.data.length : page2.data.length);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
