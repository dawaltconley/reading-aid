import { MenuItem, Reading, ReadingPartial } from '../../types/common';

import { useState, useContext } from 'react';
import { Box, Container } from '@mui/material';
import { faFolderOpen, faDownload } from '@fortawesome/pro-solid-svg-icons';

import './App.css';

import ActiveReading from '../context/ActiveReading';
import AppMenu from './AppMenu';
import AppReadings from './AppReadings';
import ReadingTimer from './ReadingTimer';

type PageNames = 'readings' | 'timer';

function AppBody({
  page,
  handleSelectReading,
}: {
  page?: PageNames;
  handleSelectReading: Function;
}) {
  switch (page) {
    case 'readings':
      return <AppReadings handleSelect={handleSelectReading} />;
    default:
      return <ReadingTimer />;
  }
}

function App() {
  const [page, setPage] = useState<PageNames>('timer');
  const [activeReading, setActiveReading] = useState<ReadingPartial>(
    useContext(ActiveReading)
  );

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

  const handleSelectReading = (reading: Reading) => {
    setActiveReading(reading);
    setPage('timer');
  };

  return (
    <ActiveReading.Provider value={activeReading}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppMenu open={false} items={menuItems} />
        <Box sx={{ flexGrow: 1, py: 4 }}>
          <AppBody page={page} handleSelectReading={handleSelectReading} />
        </Box>
      </Box>
    </ActiveReading.Provider>
  );
}

export default App;
