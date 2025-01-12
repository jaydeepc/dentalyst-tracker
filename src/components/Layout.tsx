import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AddCircle as AddIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

const Layout = ({ children }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'New Expense', icon: <AddIcon />, path: '/expense-entry' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { text: 'Consultants', icon: <PeopleIcon />, path: '/consultants' },
  ];

  const drawer = (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: 'linear-gradient(180deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0) 100%)',
          borderRadius: 0,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '10%',
            width: '80%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.2), transparent)',
          },
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: '80%',
              maxWidth: '180px',
              position: 'relative',
            }}
          >
            <img
              src={logo}
              alt="Dentalyst Logo"
              style={{
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              }}
            />
          </Box>
          <Stack spacing={0.5} alignItems="center">
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '1.5rem',
              }}
            >
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '1.07rem',
                opacity: 0.8,
              }}
            >
              Expense Tracker
            </Typography>
          </Stack>
        </Stack>
      </Paper>
      <List sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 1,
              py: 1.5,
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                backgroundColor: 'rgba(33, 150, 243, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.12)',
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
                '& .MuiListItemText-primary': {
                  color: theme.palette.primary.dark,
                  fontWeight: 600,
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.04)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: location.pathname === item.path
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: location.pathname === item.path ? 600 : 500,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: 'block', sm: 'none' },
              width: '40px',
              height: '40px',
              mr: 2,
            }}
          >
            <img
              src={logo}
              alt="Dentalyst Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            {menuItems.find((item) => item.path === location.pathname)?.text}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#ffffff',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#ffffff',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
