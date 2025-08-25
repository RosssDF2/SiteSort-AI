import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { HelpOutline, Apps, Settings, AccountCircle, Add } from '@mui/icons-material';
import { UserContext } from '../contexts/UserContext';
import MainLayout from '../layouts/MainLayout';
import axios from '../http';
import SortaBot from '../components/SortaBot';
import { useNavigate } from 'react-router-dom';
import { Select, InputLabel, FormControl } from '@mui/material';


function AdminPanel() {
    const { user } = useContext(UserContext);
    console.log("Logged-in user object:", user);

    const username = user?.email?.split('@')[0];
    const [anchorEl, setAnchorEl] = useState(null);
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', username: '', password: '', role: 'manager' });

    const openMenu = Boolean(anchorEl);
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);


    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        const res = await axios.get('/admin/users');
        setUsers(res.data);

    };

    const handleOpenForm = (user = null) => {
        setEditingUser(user);
        setFormData(user ? {
            email: user.email,
            username: user.username || '',
            password: '',
            role: user.role
        } : {
            email: '',
            username: '',
            password: '',
            role: 'manager'
        });

        setOpen(true);
    };

    // Password validation function
    const validatePassword = (password) => {
        // At least 8 chars, one uppercase, one lowercase, one number, one special char (_ or other)
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\W]).{8,}$/;
        return regex.test(password);
    };

    const handleSave = async () => {
        // Validate password for new user or if editing and password is set
        if (!editingUser && !validatePassword(formData.password)) {
            alert('Password must be at least 8 characters, include one uppercase letter, one lowercase letter, one number, and one special character (e.g. _).');
            return;
        }
        if (editingUser && formData.password && !validatePassword(formData.password)) {
            alert('Password must be at least 8 characters, include one uppercase letter, one lowercase letter, one number, and one special character (e.g. _).');
            return;
        }
        try {
            if (editingUser) {
                await axios.put(`/admin/users/${editingUser._id}`, {
                    username: formData.username,
                    password: formData.password
                });
            } else {
                await axios.post('/admin/users', formData); // contains username
            }
            fetchManagers();
            setOpen(false);
        } catch (err) {
            console.error('Save failed:', err?.response?.data || err.message);
            alert(err?.response?.data?.error || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        await axios.delete(`/admin/users/${id}`);
        fetchManagers();
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };
    const roleColors = {
        admin: "#EF4444",    // red
        manager: "#9C27B0",  // purple
        employee: "#3B82F6", // blue
    };

    return (
        <MainLayout>
            <Box sx={{ ml: { md: '220px', xs: 0 }, p: 3 }}>
                {/* Heading and Add Button */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">Manage Users</Typography>
                    <Button startIcon={<Add />} variant="contained" onClick={() => handleOpenForm()}>New User</Button>
                </Box>

                {/* Manager Table */}
                <Paper sx={{ p: 2 }}>
                    {Array.isArray(users) && users.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary" py={6}>
                            No managers found. Click <strong>"New Manager"</strong> to create one.
                        </Typography>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(users) && users
                                    .filter((u) => u._id !== user?.id)
                                    // ✅ hide self from list
                                    .map((u) => (
                                        <TableRow key={u._id}>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.username || '—'}</TableCell>
                                            <TableCell>
                                                <Box
                                                    component="span"
                                                    px={2}
                                                    py={0.5}
                                                    sx={{
                                                        backgroundColor: roleColors[u.role] || "#ddd",
                                                        borderRadius: 2,
                                                        color: "white",
                                                        fontWeight: 500,
                                                        textTransform: "capitalize",
                                                        fontSize: "0.85rem",
                                                        display: "inline-block"
                                                    }}
                                                >
                                                    {u.role}
                                                </Box>
                                            </TableCell>

                                            <TableCell align="right">
                                                <Button onClick={() => handleOpenForm(u)}>Edit</Button>
                                                <Button color="error" onClick={() => {
                                                    setUserToDelete(u);
                                                    setConfirmOpen(true);
                                                }}>
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>

                {/* Create/Edit Dialog */}
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>{editingUser ? 'Edit User' : 'New User'}</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!!editingUser}
                        />
                        <TextField
                            label="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        {!editingUser && (
                            <TextField
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                helperText="At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special (_ or symbol)"
                                error={formData.password.length > 0 && !validatePassword(formData.password)}
                            />
                        )}

                        <FormControl fullWidth>
                            <InputLabel id="role-label">Role</InputLabel>
                            <Select
                                labelId="role-label"
                                value={formData.role}
                                label="Role"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <MenuItem value="manager">Manager</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="employee">Employee</MenuItem>
                            </Select>
                        </FormControl>

                        {editingUser && (
                            <Button
                                variant="outlined"
                                onClick={async () => {
                                    try {
                                        await axios.post(`/auth/request-reset`, { email: editingUser.email });
                                        alert('Password reset email sent to manager.');
                                    } catch (err) {
                                        alert(err.response?.data?.error || "Failed to send reset link.");
                                    }
                                }}
                            >
                                Send Password Reset Link
                            </Button>
                        )}

                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} variant="contained">{editingUser ? 'Save Changes' : 'Create'}</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete user...
                            <strong>{userToDelete?.email}</strong>?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button
                            onClick={async () => {
                                await axios.delete(`/admin/users/${userToDelete._id}`);
                                setConfirmOpen(false);
                                setUserToDelete(null);
                                fetchManagers();
                            }}
                            color="error"
                            variant="contained"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {user?.role === 'manager' && <SortaBot />}
            </Box>
        </MainLayout>
    );
}

export default AdminPanel;
