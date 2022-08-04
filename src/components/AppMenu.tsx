import { MenuItem, PartialReading } from '../../types/common';
import { useState, useContext } from 'react';
import {
  AppBar,
  Box,
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
import { faBars } from '@fortawesome/pro-solid-svg-icons';

import ActiveReading from '../context/ActiveReading';

function AppMenu(props: { items: MenuItem[]; open: boolean }) {
  const { items = [] } = props;

  const activeReading: PartialReading = useContext(ActiveReading);
  const [open, setOpen] = useState(props.open);
  const toggleDrawer = () => setOpen(!open);

  return (
    <AppBar position="sticky" component="nav">
      <Toolbar>
        <IconButton onClick={toggleDrawer}>
          <FontAwesomeIcon icon={faBars} />
        </IconButton>
        <Typography>{activeReading.title || 'New reading'}</Typography>
      </Toolbar>
      <SwipeableDrawer
        anchor="left"
        variant="temporary"
        open={open}
        onOpen={toggleDrawer}
        onClose={toggleDrawer}
        swipeAreaWidth={0}
      >
        <List sx={{ minWidth: '200px' }}>
          {items.map(item => (
            <ListItem key={item.name} disableGutters>
              <ListItemButton
                onClick={() => {
                  toggleDrawer();
                  item.action();
                }}
              >
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
