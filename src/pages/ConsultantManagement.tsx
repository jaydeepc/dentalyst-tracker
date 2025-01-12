import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Fade,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

interface Consultant {
  _id: string;
  name: string;
  specialization: string;
  active: boolean;
}

interface ConsultantFormData {
  name: string;
  specialization: string;
}

const ConsultantManagement = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [formData, setFormData] = useState<ConsultantFormData>({
    name: '',
    specialization: '',
  });
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const fetchConsultants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/consultants`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultants');
      }
      const data = await response.json();
      setConsultants(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch consultants',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const validateForm = (data: ConsultantFormData) => {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      setSnackbar({
        open: true,
        message: 'Name cannot be empty',
        severity: 'error',
      });
      return false;
    }
    if (trimmedName.length < 2) {
      setSnackbar({
        open: true,
        message: 'Name must be at least 2 characters long',
        severity: 'error',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim values before validation
    const trimmedData = {
      name: formData.name.trim(),
      specialization: formData.specialization.trim()
    };

    if (!validateForm(trimmedData)) {
      return;
    }

    try {
      const url = editingConsultant
        ? `${API_BASE_URL}/api/consultants/${editingConsultant._id}`
        : `${API_BASE_URL}/api/consultants`;
      

      console.log('Sending request:', {
        url,
        method: editingConsultant ? 'PUT' : 'POST',
        body: trimmedData
      });

      const response = await fetch(url, {
        method: editingConsultant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedData),
      });

      const responseData = await response.json();
      console.log('Response:', {
        status: response.status,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(responseData.details?.[0] || 'Failed to save consultant');
      }

      setFormData({ name: '', specialization: '' });
      setEditingConsultant(null);
      fetchConsultants();
      setSnackbar({
        open: true,
        message: `Consultant ${editingConsultant ? 'updated' : 'added'} successfully`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error in handleSubmit:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save consultant',
        severity: 'error',
      });
    }
  };

  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setFormData({
      name: consultant.name,
      specialization: consultant.specialization,
    });
  };

  const handleDelete = async () => {
    if (!selectedConsultant) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/consultants/${selectedConsultant._id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details?.[0] || 'Failed to delete consultant');
      }
      fetchConsultants();
      setSnackbar({
        open: true,
        message: data.message,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error in handleDelete:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete consultant',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedConsultant(null);
    }
  };

  return (
    <Fade in timeout={800}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h4" gutterBottom color="primary.dark" fontWeight={700}>
          Consultant Management
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  helperText="Must be at least 2 characters long"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="Specialization"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData({ ...formData, specialization: e.target.value })
                  }
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ minWidth: 120, height: 56 }}
                >
                  {editingConsultant ? 'Update' : 'Add'} Consultant
                </Button>
                {editingConsultant && (
                  <Button
                    color="secondary"
                    sx={{ minWidth: 120, height: 56 }}
                    onClick={() => {
                      setEditingConsultant(null);
                      setFormData({ name: '', specialization: '' });
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </form>
          </CardContent>
        </Card>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultants.map((consultant) => (
                <TableRow key={consultant._id}>
                  <TableCell>{consultant.name}</TableCell>
                  <TableCell>{consultant.specialization}</TableCell>
                  <TableCell>
                    <Chip
                      label={consultant.active ? 'Active' : 'Inactive'}
                      color={consultant.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(consultant)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedConsultant(consultant);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete {selectedConsultant?.name}?
            {selectedConsultant?.active && (
              <Typography color="error" sx={{ mt: 2 }}>
                Note: If this consultant has any expenses, they will be marked as inactive instead of being deleted.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default ConsultantManagement;
