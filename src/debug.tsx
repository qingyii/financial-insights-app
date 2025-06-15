import React from 'react';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

function DebugApp() {
  return (
    <Theme appearance="dark" accentColor="ruby">
      <div style={{ padding: '20px', color: 'white' }}>
        <h1>Debug Test - Financial Trading Platform</h1>
        <p>If you can see this, React is working!</p>
        <div style={{ background: 'var(--gray-3)', padding: '10px', margin: '10px 0' }}>
          <p>Theme test - this should have dark styling</p>
        </div>
      </div>
    </Theme>
  );
}

export default DebugApp;