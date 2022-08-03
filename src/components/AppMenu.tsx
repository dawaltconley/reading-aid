import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  SwipeableDrawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  IconDefinition,
  faBars,
  faFolderOpen,
  faDownload,
} from '@fortawesome/pro-solid-svg-icons';

interface MenuItem {
  name: string;
  icon: IconDefinition;
  action: Function;
}

const menuItems: MenuItem[] = [
  {
    name: 'Load',
    icon: faFolderOpen,
    action: () => console.log('not implemented'),
  },
  {
    name: 'Install',
    icon: faDownload,
    action: () => console.log('not implemented'),
  },
];

function AppMenu(
  props: {
    open: boolean;
  } = { open: false }
) {
  const [open, setOpen] = useState(props.open);
  const toggleDrawer = () => setOpen(!open);

  return (
    <AppBar position="fixed" component="nav">
      <Toolbar>
        <IconButton onClick={toggleDrawer}>
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
        <Typography>Name of current reading</Typography>
      </Toolbar>
      <SwipeableDrawer
        anchor="left"
        variant="temporary"
        open={open}
        onOpen={toggleDrawer}
        onClose={toggleDrawer}
        swipeAreaWidth={50}
      >
        <List sx={{ minWidth: '200px' }}>
          {menuItems.map(item => (
            <ListItem key={item.name} disableGutters>
              <ListItemButton onClick={() => item.action()}>
                <ListItemIcon>
                  <FontAwesomeIcon icon={item.icon} />
                </ListItemIcon>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
    </AppBar>
  );
}

export default AppMenu;
