import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Shared state
export let currentUser = null;
export let currentUserRole = null; // 'admin' or 'user'

// Callbacks for when auth state changes
const authListeners = [];
export function onAuthChange(callback) {
    authListeners.push(callback);
}

const triggerAuthChange = (user, role) => {
    authListeners.forEach(cb => cb(user, role));
};

if (auth) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Fetch role from Firestore
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    currentUserRole = userDoc.data().role;
                } else {
                    currentUserRole = 'user'; // fallback
                }
            } catch (error) {
                console.warn("Failed to fetch user role, fallback to user", error);
                currentUserRole = 'user';
            }
        } else {
            currentUser = null;
            currentUserRole = null;
        }
        triggerAuthChange(currentUser, currentUserRole);
    });
} else {
    // Mock auth if Firebase is missing
    console.warn("Firebase Auth not loaded, using mock authentication context");
    setTimeout(() => {
        // Modify this if you want to test mock admin
        // currentUser = { uid: 'mock-user', email: 'mock@example.com' }; currentUserRole = 'user'; 
        triggerAuthChange(currentUser, currentUserRole);
    }, 500);
}

const mockRegisteredUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');

export const registerUser = async (email, password, role) => {
    if (!auth) {
        if (mockRegisteredUsers.find(u => u.email === email)) {
            throw new Error('User already exists. Please log in.');
        }
        const newUser = { uid: Date.now().toString(), email, role };
        mockRegisteredUsers.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(mockRegisteredUsers));
        
        currentUser = newUser;
        currentUserRole = role;
        triggerAuthChange(currentUser, currentUserRole);
        return;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Save role to Firestore
    if (db) {
        await setDoc(doc(db, "users", user.uid), {
            email,
            role
        });
    }
};

export const loginUser = async (email, password) => {
    if (!auth) {
        const user = mockRegisteredUsers.find(u => u.email === email);
        if (!user) {
            throw new Error('No account found for this email. Please sign up first.');
        }
        currentUser = user;
        currentUserRole = user.role;
        triggerAuthChange(currentUser, currentUserRole);
        return;
    }
    await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
    if (!auth) {
        currentUser = null;
        currentUserRole = null;
        triggerAuthChange(null, null);
        return;
    }
    await signOut(auth);
};
