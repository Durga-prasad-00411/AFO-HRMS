import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

function TransitionUp(props) {
  return <Slide {...props} direction="up" />;
}

const Toast = ({ open, message, severity, handleClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={TransitionUp}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        variant="filled"
        sx={{ 
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
          fontWeight: 600
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
