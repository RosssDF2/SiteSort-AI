import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { HelpOutline, Apps, Settings, AccountCircle, Add } from '@mui/icons-material';
import { UserContext } from '../contexts/UserContext';
import MainLayout from '../layouts/MainLayout';
import axios from '../http';
import SortaBot from '../components/SortaBot';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
    const { user } = useContext(UserContext);
    const username = user?.email?.split('@')[0];
    const [anchorEl, setAnchorEl] = useState(null);
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', username: '', password: '', role: 'manager' });

    const openMenu = Boolean(anchorEl);
    const navigate = useNavigate();

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        const res = await axios.get('/admin/users');
        const managers = res.data.filter(u => u.role === 'manager');
        setUsers(managers);
    };

    const handleOpenForm = (user = null) => {
        setEditingUser(user);
        setFormData(user ? { email: user.email, password: '', role: user.role } : { email: '', password: '', role: 'manager' });
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
                    <Typography variant="h4">Manage Managers</Typography>
                    <Button startIcon={<Add />} variant="contained" onClick={() => handleOpenForm()}>New Manager</Button>
                </Box>

                {/* Manager Table */}
                <Paper sx={{ p: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u._id}>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.role}</TableCell>
                                    <TableCell align="right">
                                        <Button onClick={() => handleOpenForm(u)}>Edit</Button>
                                        <Button color="error" onClick={() => handleDelete(u._id)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>

                {/* Create/Edit Dialog */}
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>{editingUser ? 'Edit Manager' : 'New Manager'}</DialogTitle>
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
                        <TextField
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} variant="contained">{editingUser ? 'Save Changes' : 'Create'}</Button>
                    </DialogActions>
                </Dialog>

                {user?.role === 'manager' && <SortaBot />}

            </Box>
        </MainLayout>
    );
}

export default AdminPanel;
