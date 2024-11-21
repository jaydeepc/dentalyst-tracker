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
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AddCircleOutline as AddIcon,
  AssessmentOutlined as ReportIcon,
} from '@mui/icons-material';
import logo from '../assets/logo.png';

interface LayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: '80%',
            maxWidth: '180px',
            height: 'auto',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: '10%',
              width: '80%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0, 98, 255, 0.2), transparent)',
            },
          }}
        >
          <img
            src={logo}
            alt="Dentalist Logo"
            style={{
              width: '100%',
              height: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
            }}
          />
        </Box>
        <Stack spacing={0.5} alignItems="center">
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Dentalist
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Expense Tracker
          </Typography>
        </Stack>
      </Box>
      
      <Divider sx={{ mx: 2, borderColor: 'rgba(0, 98, 255, 0.08)' }} />
      
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <Tooltip
              key={item.text}
              title={item.text}
              placement="right"
              arrow
            >
              <ListItemButton
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
                  px: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 98, 255, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 98, 255, 0.12)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 98, 255, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: location.pathname === item.path
                      ? 'primary.main'
                      : 'text.secondary',
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
            </Tooltip>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center',
          }}
        >
          © {new Date().getFullYear()} Dentalist
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
            sx={{
              mr: 2,
              display: { sm: 'none' },
              color: 'text.secondary',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {menuItems.find((item) => item.path === location.pathname)?.text}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
        }}
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
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
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
              borderRight: 'none',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.06)',
              background: '#ffffff',
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
          minHeight: '100vh',
          backgroundColor: 'background.default',
          pt: { xs: '64px', sm: '80px' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
