import { createTheme } from '@mui/material/styles';

export const neuralTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7f5af0',
    },
    secondary: {
      main: '#2cb67d',
    },
    background: {
      default: '#16161a',
      paper: '#242629',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});
