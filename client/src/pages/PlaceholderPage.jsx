// src/pages/PlaceholderPage.jsx
// Generic placeholder used for routes not yet implemented.
// Props: eyebrow, title, description

import React from 'react';
import AppShell from '../components/layout/AppShell';
import PageHeader from '../components/ui/PageHeader';

/**
 * @param {{ eyebrow?: string, title: string, description?: string }} props
 */
export default function PlaceholderPage({ eyebrow, title, description }) {
  return (
    <AppShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <p className="text-sm text-gray-500 italic">Coming in a later step.</p>
    </AppShell>
  );
}
