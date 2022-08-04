import { MenuItem } from '../../types/common';

import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { faFolderOpen, faDownload } from '@fortawesome/pro-solid-svg-icons';

import './App.css';

import AppMenu from './AppMenu';
import AppReadings from './AppReadings';
import ReadingTimer from './ReadingTimer';

type PageNames = 'readings' | 'timer';

function AppBody({ page }: { page?: PageNames }) {
  switch (page) {
    case 'readings':
      return <AppReadings />;
    default:
      return <ReadingTimer />;
  }
}

function App() {
  const [page, setPage] = useState<PageNames>('timer');

  const menuItems: MenuItem[] = [
    {
      name: 'Load',
      icon: faFolderOpen,
      action: () => setPage('readings'),
    },
    {
      name: 'Install',
      icon: faDownload,
      action: () => console.log('not implemented'),
    },
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppMenu open={false} items={menuItems} />
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <AppBody page={page} />
      </Box>
    </Box>
  );
}

export default App;
