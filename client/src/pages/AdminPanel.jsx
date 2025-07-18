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

    const handleSave = async () => {
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
        manager: "#10B981",  // green
        employee: "#3B82F6", // blue
    };

    return (
        <MainLayout>
            {/* Top Right Icons */}
            <Box sx={{ ml: '220px', p: 3 }}>

                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mb={3}>
                    <IconButton><HelpOutline /></IconButton>
                    <IconButton><Apps /></IconButton>
                    <IconButton><Settings /></IconButton>
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <AccountCircle />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={() => setAnchorEl(null)}>
                        <Box px={2} py={1}>
                            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                            <Typography variant="subtitle1">Hi, <span style={{ color: "#10B981" }}>{username}</span></Typography>
                        </Box>
                        <MenuItem disabled>➕ Add account</MenuItem>
                        <Box px={2} py={1}>
                            <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
                                Sign out
                            </Button>
                        </Box>
                    </Menu>
                </Box>

                {/* Heading and Add Button */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">Manage Users</Typography>
                    <Button startIcon={<Add />} variant="contained" onClick={() => handleOpenForm()}>New User</Button>
                </Box>

                {/* Manager Table */}
                <Paper sx={{ p: 2 }}>
                    {users.length === 0 ? (
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
                                {users
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
