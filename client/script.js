import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    deleteDoc, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvZSSIkEk_RBvWujbkotqBd8rYIaeTzdk",
    authDomain: "hospital-1d69e.firebaseapp.com",
    databaseURL: "https://hospital-1d69e-default-rtdb.firebaseio.com",
    projectId: "hospital-1d69e",
    storageBucket: "hospital-1d69e.firebasestorage.app",
    messagingSenderId: "1046499472315",
    appId: "1:1046499472315:web:5a0433dbca86799e474a9e",
    measurementId: "G-5DDEPKDGQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global State
let currentUser = null;
let userRole = null;

// Initialize Page Immediately for Event Listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupAuthForm();
    });
} else {
    setupAuthForm();
}

// Auth State Listener
onAuthStateChanged(auth, async (user) => {
    const path = window.location.pathname;
    
    if (user) {
        currentUser = user;
        console.log("User logged in:", user.email);
        
        try {
            // Get User Role
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                userRole = userDoc.data().role;
                console.log("Role:", userRole);
                
                // Redirect based on role if on login page or root
                if (path.endsWith('index.html') || path === '/' || path.endsWith('login.html') || path.endsWith('admin-login.html')) {
                    // Auto Redirect to Dashboard
                    if (userRole === 'admin') window.location.href = 'admin-dashboard.html';
                    else window.location.href = 'dashboard.html';
                }

                // Protect Routes
                const adminBypass = sessionStorage.getItem('admin_bypass');
                if (path.includes('admin-dashboard') && userRole !== 'admin' && !adminBypass) window.location.href = 'index.html';
                
                // Init Page Logic
                initPage();
            } else {
                console.error("No user document found!");
            }
        } catch (e) {
            console.error("Error fetching user role:", e);
        }
    } else {
        // No user
        console.log("No user logged in");
        if (path.includes('dashboard') || path.includes('admin')) {
            // Check Admin Bypass
            const adminBypass = sessionStorage.getItem('admin_bypass');
            if (path.includes('admin-dashboard') && adminBypass) {
                // Allow Access
                initPage();
                return;
            }

            // Redirect protected routes
            if (!path.endsWith('login.html') && !path.endsWith('register.html') && !path.endsWith('index.html') && !path.endsWith('admin-login.html') && path !== '/') {
                 window.location.href = 'index.html';
            }
        }
        
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const dashLink = document.getElementById('dashboard-link');

        if(loginBtn) loginBtn.style.display = 'inline-block';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(dashLink) dashLink.style.display = 'none';

        // Initialize page for guests (e.g. Home page doctors list, Login form)
        initPage();
    }
});

// Logout Handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('admin_bypass');
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        });
    });
}

// Navbar Login Handler
const navLoginBtn = document.getElementById('login-btn');
if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex';
    });
}

// Page Initialization Logic
function initPage() {
    const path = window.location.pathname;
    
    // Admin Bypass Logic Check
    if (path.includes('admin-dashboard.html')) {
        const adminBypass = sessionStorage.getItem('admin_bypass');
        if (adminBypass) {
            loadAdminDashboard();
            return;
        }
    }

    if (path.endsWith('index.html') || path === '/' || path.endsWith('admin-login.html')) {
        loadDoctorsList();
        setupAuthForm();
    } else if (path.includes('dashboard.html')) {
        loadPatientDashboard();
    } else if (path.includes('admin-dashboard.html')) {
        loadAdminDashboard();
    }
}

// --- Auth Form Logic (Login/Register) ---
function setupAuthForm() {
    const form = document.getElementById('auth-form');
    if (!form || form.dataset.initialized) return;
    form.dataset.initialized = "true";

    const switchBtn = document.getElementById('switch-auth');
    const nameGroup = document.getElementById('name-group');
    const mobileGroup = document.getElementById('mobile-group');
    const specGroup = document.getElementById('spec-group'); // For Doctor Login
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const switchText = document.getElementById('switch-text');
    
    let isRegister = false;

    if (switchBtn) {
        switchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isRegister = !isRegister;
            if (isRegister) {
                nameGroup.style.display = 'block';
                if (mobileGroup) mobileGroup.style.display = 'block';
                if (specGroup) specGroup.style.display = 'block';
                modalTitle.innerText = 'Register';
                submitBtn.innerText = 'Register';
                switchText.innerText = 'Already have an account? ';
                switchBtn.innerText = 'Login here';
                
                // Role Selector removed from main flow - handled by specific pages
            } else {
                nameGroup.style.display = 'none';
                if (mobileGroup) mobileGroup.style.display = 'none';
                if (specGroup) specGroup.style.display = 'none';
                modalTitle.innerText = 'Login';
                submitBtn.innerText = 'Login';
                switchText.innerText = 'New user? ';
                switchBtn.innerText = 'Register here';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                if (isRegister) {
                    const name = document.getElementById('name').value;
                    const mobile = document.getElementById('mobile') ? document.getElementById('mobile').value : '';
                    // Detect Role from body attribute or default to patient
                    const bodyRole = document.body.getAttribute('data-role');
                    const role = bodyRole || 'patient';
                    
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    
                    // Create User Doc
                    await setDoc(doc(db, "users", user.uid), {
                        name: name,
                        email: email,
                        mobile: mobile,
                        role: role,
                        createdAt: new Date().toISOString()
                    });

                    if (isRegister) {
                        const specElement = document.getElementById('specialization');
                        if (specElement && specElement.offsetParent !== null) {
                            // It's a doctor registration (hidden logic for admin to add doctors manually if needed, or remove completely)
                            // For now, removing doctor self-registration logic from public view
                        }
                    }
                    
                    alert("Registration Successful!");
                    document.getElementById('login-modal').style.display = 'none';
                } else {
                    // Direct Login Logic
                    // Check if we are on the admin login page
                    if (window.location.href.includes('admin-login.html')) {
                        // Hardcoded Admin Bypass for Demo
                        if (email === 'admin@medcare.com' && password === 'admin123') {
                            console.log("Admin Bypass Activated");
                            sessionStorage.setItem('admin_bypass', 'true');
                            window.location.href = 'admin-dashboard.html';
                            return; // STOP HERE, do not call Firebase
                        }
                    }
                    
                    await signInWithEmailAndPassword(auth, email, password);
                    document.getElementById('login-modal').style.display = 'none';
                }
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        });
    }
}

// --- Admin Doctor Management ---

async function loadAdminDoctorsList() {
    const list = document.getElementById('admin-doctors-list');
    if (!list) return;

    try {
        const q = query(collection(db, "doctors"));
        const querySnapshot = await getDocs(q);
        
        document.getElementById('total-doctors').innerText = querySnapshot.size;
        
        list.innerHTML = '';
        if (querySnapshot.empty) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem;">No doctors found.</td></tr>';
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Dr. ${data.name}</td>
                <td>${data.specialization}</td>
                <td>₹${data.fee}</td>
                <td>${data.availability || 'Not set'}</td>
                <td>
                    <button onclick="deleteDoctor('${doc.id}')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--danger);">Delete</button>
                </td>
            `;
            list.appendChild(row);
        });
    } catch (e) {
        console.error("Error loading doctors list:", e);
    }
}

// Add Doctor Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const addDocForm = document.getElementById('add-doctor-form');
    if (addDocForm) {
        addDocForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('doc-name').value;
            const spec = document.getElementById('doc-spec').value;
            const fee = document.getElementById('doc-fee').value;
            const avail = document.getElementById('doc-availability').value;
            
            try {
                await addDoc(collection(db, "doctors"), {
                    name: name,
                    specialization: spec,
                    fee: Number(fee),
                    availability: avail,
                    createdAt: new Date().toISOString()
                });
                alert("Doctor added successfully!");
                document.getElementById('add-doctor-modal').style.display = 'none';
                addDocForm.reset();
                loadAdminDoctorsList(); // Reload list
            } catch (error) {
                console.error("Error adding doctor:", error);
                alert("Failed to add doctor: " + error.message);
            }
        });
    }
});

// Make deleteDoctor global
window.deleteDoctor = async (id) => {
    if (confirm("Are you sure you want to delete this doctor?")) {
        try {
            await deleteDoc(doc(db, "doctors", id));
            loadAdminDoctorsList(); // Reload list
        } catch (error) {
            console.error("Error deleting doctor:", error);
            alert("Failed to delete doctor.");
        }
    }
};

// --- Data Loading Functions ---

async function loadDoctorsList() {
    const list = document.getElementById('doctors-list');
    if (!list) return;
    
    list.innerHTML = '<p>Loading specialists...</p>';
    
    try {
        const q = query(collection(db, "doctors"));
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = '';
        if (querySnapshot.empty) {
            // Seed Dummy Doctors if empty
            await seedDoctors();
            return loadDoctorsList(); // Reload
        }
        
        querySnapshot.forEach((doc) => {
            const docData = doc.data();
            const card = document.createElement('div');
            card.className = 'glass-card interactive-card';
            card.innerHTML = `
                <h3>Dr. ${docData.name}</h3>
                <p style="color: var(--primary); margin-bottom: 0.5rem;">${docData.specialization}</p>
                <p>Fee: ₹${docData.fee}</p>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;" onclick="alert('Please login to book appointment')">Book Now</button>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        console.error("Error loading doctors:", e);
    }
}

async function loadPatientDashboard() {
    // Populate Doctor Select
    const select = document.getElementById('doctor-select');
    if (!select) return; // Prevent error if element not found (e.g. on wrong page)

    const q = query(collection(db, "doctors"));
    const querySnapshot = await getDocs(q);
    
    select.innerHTML = '<option value="">Choose a Doctor...</option>';
    
    // Store doctor fees in a map for easy lookup
    const doctorFees = {};

    querySnapshot.forEach((doc) => {
        const d = doc.data();
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.innerText = `Dr. ${d.name} (${d.specialization})`;
        select.appendChild(opt);
        doctorFees[doc.id] = d.fee;
    });

    // Update Price on Selection
    const priceDisplay = document.getElementById('price-display');
    select.addEventListener('change', () => {
        const fee = doctorFees[select.value] || 0;
        priceDisplay.innerText = `₹${fee}`;
    });

    // Handle Booking
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Fetch user mobile first
        let userMobile = '';
        try {
             const userDoc = await getDoc(doc(db, "users", currentUser.uid));
             if (userDoc.exists()) {
                 userMobile = userDoc.data().mobile || '';
             }
        } catch (e) {
            console.error("Error fetching user mobile:", e);
        }

        const doctorId = select.value;
        const fee = doctorFees[doctorId];
        
        if (!fee) {
            alert("Please select a valid doctor.");
            return;
        }

        // Proceed to Payment
        const options = {
            "key": "rzp_test_SIiVGYqVgw9cr8", // Updated Key
            "amount": fee * 100, // Amount in paise
            "currency": "INR",
            "name": "MedCare Hospital",
            "description": "Consultation Fee",
            "handler": async function (response) {
                // Payment Success - Book Appointment
                try {
                    await addDoc(collection(db, "appointments"), {
                        patientId: currentUser.uid,
                        patientName: currentUser.displayName || currentUser.email.split('@')[0],
                        mobile: userMobile,
                        doctorId: doctorId,
                        doctorName: select.options[select.selectedIndex].text.split(' (')[0].replace('Dr. ', ''),
                        date: document.getElementById('date').value,
                        time: document.getElementById('time').value,
                        status: 'pending',
                        paymentId: response.razorpay_payment_id,
                        paymentStatus: 'paid',
                        fee: fee,
                        createdAt: new Date().toISOString()
                    });
                    
                    alert("Payment Successful! Appointment Booked.");
                    window.location.reload();
                } catch (error) {
                    console.error("Booking Error:", error);
                    alert("Payment successful but booking failed. Contact support.");
                }
            },
            "prefill": {
                "name": currentUser.displayName || currentUser.email.split('@')[0],
                "email": currentUser.email,
                "contact": userMobile
            },
            "theme": {
                "color": "#6e8efb"
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response){
                alert("Payment Failed: " + response.error.description);
        });
        rzp1.open();
    });

    loadMyAppointments();
}

async function loadMyAppointments() {
    const list = document.getElementById('appointments-list');
    const q = query(collection(db, "appointments"), where("patientId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Dr. ${data.doctorName}</td>
            <td>${data.date}</td>
            <td>${data.time}</td>
            <td><span class="status-badge status-${data.status}">${data.status}</span></td>
            <td>
                ${data.status === 'pending' ? '<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Cancel</button>' : '-'}
            </td>
        `;
        list.appendChild(row);
    });
}

async function loadDoctorDashboard() {
    document.getElementById('doctor-name').innerText = (await getDoc(doc(db, "users", currentUser.uid))).data().name;
    
    const list = document.getElementById('doctor-appointments-list');
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.patientName}</td>
            <td>${data.date}</td>
            <td>${data.time}</td>
            <td><span class="status-badge status-${data.status}">${data.status}</span></td>
            <td>
                ${data.status === 'pending' ? `
                    <button onclick="updateStatus('${docSnap.id}', 'approved')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--success);">Approve</button>
                    <button onclick="updateStatus('${docSnap.id}', 'rejected')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--danger);">Reject</button>
                ` : '-'}
            </td>
        `;
        list.appendChild(row);
    });
}

async function loadAdminDashboard() {
    try {
        const list = document.getElementById('admin-appointments-list');
        // Initial Loading State
        document.getElementById('total-appointments').innerText = '...';
        document.getElementById('pending-appointments').innerText = '...';
        document.getElementById('total-doctors').innerText = '...';

        // Check auth first
        const adminBypass = sessionStorage.getItem('admin_bypass');
        if (!currentUser && !adminBypass) {
            console.log("Waiting for auth...");
            return; // Will be called again by onAuthStateChanged
        }

        const q = query(collection(db, "appointments"));
        const querySnapshot = await getDocs(q);
        
        let total = 0;
        let pending = 0;
        
        list.innerHTML = '';
        if (querySnapshot.empty) {
            list.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 1rem;">No appointments found.</td></tr>';
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            total++;
            if (data.status === 'pending') pending++;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.patientName}</td>
                <td>${data.mobile || '-'}</td>
                <td>Dr. ${data.doctorName}</td>
                <td>${data.date} at ${data.time}</td>
                <td><span style="color: var(--success); font-weight: bold;">${data.paymentStatus || 'Paid'}</span></td>
                <td><span class="status-badge status-${data.status}">${data.status}</span></td>
                <td>
                    ${data.status === 'pending' ? `
                        <button onclick="updateStatus('${doc.id}', 'confirmed')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--success);">Confirm</button>
                        <button onclick="updateStatus('${doc.id}', 'rejected')" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--danger);">Reject</button>
                    ` : '-'}
                </td>
            `;
            list.appendChild(row);
        });
        
        document.getElementById('total-appointments').innerText = total;
                document.getElementById('pending-appointments').innerText = pending;
                
                // Load Doctors for Admin
                loadAdminDoctorsList();

            } catch (e) {
                console.error("Error loading admin dashboard:", e);
        document.getElementById('total-appointments').innerText = '0';
        document.getElementById('pending-appointments').innerText = '0';
        document.getElementById('total-doctors').innerText = '0';
        alert("Error loading dashboard data. Check console.");
    }
}

// Global functions for HTML access
window.updateStatus = async (id, status) => {
    try {
        await updateDoc(doc(db, "appointments", id), { status: status });
        alert(`Appointment ${status}`);
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Error updating status");
    }
};

async function seedDoctors() {
    const doctors = [
        { name: "Aditya Mohite", specialization: "Cardiologist", fee: 1500 },
        { name: "Shiv Mundhe", specialization: "Neurologist", fee: 2000 },
        { name: "John Smith", specialization: "Pediatrician", fee: 800 }
    ];
    
    for (const d of doctors) {
        await addDoc(collection(db, "doctors"), d);
    }
    console.log("Seeded doctors");
}
